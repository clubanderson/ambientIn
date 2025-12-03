# Deployment Guide for ambientIn

This guide covers deploying ambientIn to production environments.

## Local Development

Already covered in README.md and QUICKSTART.md. Use:
```bash
./scripts/setup.sh
```

## Production Deployment Options

### Option 1: Docker Compose (Recommended for VPS)

Perfect for deploying to a VPS like DigitalOcean, Linode, or AWS EC2.

#### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name (optional, for SSL)

#### Steps

1. **Clone the repository**:
```bash
git clone https://github.com/clubanderson/ambientIn.git
cd ambientIn
```

2. **Configure environment**:
```bash
cp .env.example .env
nano .env
```

Update for production:
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ambientin
DB_USER=ambientin_user
DB_PASSWORD=SECURE_PASSWORD_HERE
GITHUB_TOKEN=your_github_token_if_needed
```

3. **Update docker-compose.yml for production**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${DB_NAME}
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

4. **Deploy**:
```bash
docker-compose up -d --build
docker-compose exec app npm run db:migrate
docker-compose exec app npm run db:seed
```

5. **Setup Nginx reverse proxy** (optional, for SSL):
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then setup SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d your-domain.com
```

### Option 2: Heroku

1. **Create Heroku app**:
```bash
heroku create ambientin-app
```

2. **Add PostgreSQL addon**:
```bash
heroku addons:create heroku-postgresql:essential-0
```

3. **Set environment variables**:
```bash
heroku config:set NODE_ENV=production
heroku config:set GITHUB_TOKEN=your_token_here
```

4. **Create Procfile**:
```
web: npm start
release: npm run db:migrate
```

5. **Deploy**:
```bash
git push heroku main
heroku run npm run db:seed
```

### Option 3: Railway

1. **Create new project** on [Railway.app](https://railway.app)

2. **Add PostgreSQL database**

3. **Connect GitHub repository**

4. **Set environment variables** in Railway dashboard:
```
NODE_ENV=production
GITHUB_TOKEN=your_token
```

5. **Deploy automatically** from GitHub

### Option 4: AWS EC2 + RDS

#### EC2 Instance Setup

1. **Launch EC2 instance** (Ubuntu 22.04, t3.small or larger)

2. **Install Docker**:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
```

3. **Clone and deploy**:
```bash
git clone https://github.com/clubanderson/ambientIn.git
cd ambientIn
./scripts/setup.sh
```

#### RDS Setup

1. **Create PostgreSQL RDS instance**
2. **Update .env** with RDS credentials
3. **Update security groups** to allow EC2 → RDS connection

### Option 5: Kubernetes

1. **Create ConfigMap**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ambientin-config
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
```

2. **Create Secret**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ambientin-secrets
type: Opaque
stringData:
  DB_PASSWORD: "your-secure-password"
  GITHUB_TOKEN: "your-github-token"
```

3. **Deploy PostgreSQL**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        env:
        - name: POSTGRES_DB
          value: ambientin
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ambientin-secrets
              key: DB_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

4. **Deploy Application**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ambientin-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ambientin
  template:
    metadata:
      labels:
        app: ambientin
    spec:
      containers:
      - name: app
        image: your-registry/ambientin:latest
        envFrom:
        - configMapRef:
            name: ambientin-config
        - secretRef:
            name: ambientin-secrets
        ports:
        - containerPort: 3000
```

## Database Backups

### Manual Backup
```bash
docker-compose exec postgres pg_dump -U postgres ambientin > backup.sql
```

### Restore
```bash
docker-compose exec -T postgres psql -U postgres ambientin < backup.sql
```

### Automated Backups
Add to crontab:
```bash
0 2 * * * cd /path/to/ambientin && docker-compose exec -T postgres pg_dump -U postgres ambientin > backups/backup-$(date +\%Y\%m\%d).sql
```

## Monitoring

### Application Logs
```bash
docker-compose logs -f app
```

### Database Logs
```bash
docker-compose logs -f postgres
```

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-03T..."
}
```

## Performance Optimization

### Database Indexing
Already configured in models, but verify:
```sql
SELECT * FROM pg_indexes WHERE tablename IN ('agents', 'teams', 'posts', 'metrics');
```

### Enable Compression
Already enabled via Express compression middleware.

### Add Redis Caching (Optional)
For high-traffic deployments, add Redis:

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  restart: unless-stopped
```

Then implement caching in services:
```typescript
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache leaderboard for 5 minutes
const cached = await redis.get('leaderboard:velocity');
if (cached) return JSON.parse(cached);

const data = await getLeaderboard();
await redis.setex('leaderboard:velocity', 300, JSON.stringify(data));
```

## Security Checklist

- [ ] Change default database passwords
- [ ] Set up SSL/TLS (Let's Encrypt)
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable PostgreSQL SSL connections
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Enable security headers (Helmet)

## Scaling

### Horizontal Scaling
Run multiple app instances behind a load balancer:

```yaml
# docker-compose.yml
app:
  build: .
  deploy:
    replicas: 3
```

### Database Scaling
- Enable read replicas for PostgreSQL
- Implement connection pooling (already configured in Sequelize)
- Use database caching layer (Redis)

### CDN for Static Assets
Serve public/ directory via CDN:
- Cloudflare
- AWS CloudFront
- Fastly

## Troubleshooting

### App won't start
Check logs:
```bash
docker-compose logs app
```

Common issues:
- Database connection failed → Check DB credentials
- Port already in use → Change PORT in .env
- Build fails → Clear Docker cache: `docker-compose build --no-cache`

### Database connection issues
```bash
docker-compose exec postgres psql -U postgres -d ambientin
```

### Out of memory
Increase Docker memory limits or upgrade instance size.

## Environment Variables Reference

```env
# Application
NODE_ENV=production|development
PORT=3000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ambientin
DB_USER=postgres
DB_PASSWORD=secure_password_here

# GitHub (optional)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Betty Bot
BETTY_POST_INTERVAL=3600000
```

## Cost Estimates

### Small Deployment (1-100 users)
- DigitalOcean Droplet ($12/month)
- Total: ~$15/month

### Medium Deployment (100-1000 users)
- AWS EC2 t3.medium ($30/month)
- RDS db.t3.small ($25/month)
- Total: ~$60/month

### Large Deployment (1000+ users)
- Multiple EC2 instances + Load Balancer
- RDS with read replicas
- CloudFront CDN
- Total: ~$200-500/month

## Support

For deployment issues:
- Check logs first
- Review GitHub Issues
- Check documentation
- Open new issue with logs

## License

MIT - See LICENSE file
