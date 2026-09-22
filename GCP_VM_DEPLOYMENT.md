# WingerX CRM — GCP VM Deployment

This deployment keeps the monthly baseline low by running the WingerX server,
worker, PostgreSQL, Redis and HTTPS proxy on one Compute Engine VM. PostgreSQL
and Redis are reachable only inside Docker Compose; the VM exposes only ports
80 and 443.

## Architecture

- `server`: WingerX/Twenty web application on internal port 10000.
- `worker`: WingerX/Twenty background queue worker.
- `postgres`: PostgreSQL 16 with a persistent Docker volume.
- `redis`: Redis 7.4 with append-only persistence and `noeviction` policy.
- `caddy`: public HTTPS endpoint and automatic certificate renewal.

Start with an `e2-small` VM, a 30 GB standard persistent disk and 4 GB of swap.
This is the minimum budget configuration for light internal use. If the kernel
reports out-of-memory events or the application remains slow, stop the VM and
resize it to `e2-medium`.

## 1. Prepare the project in Cloud Shell

Enable billing on the project, open Cloud Shell, and set these values:

```bash
export WINGERX_PROJECT_ID="your-gcp-project-id"
export WINGERX_REGION="asia-south1"
export WINGERX_ZONE="asia-south1-a"
export WINGERX_VM_NAME="wingerx-vm"
export WINGERX_ARTIFACT_REPOSITORY="wingerx"
export WINGERX_IMAGE_URI="${WINGERX_REGION}-docker.pkg.dev/${WINGERX_PROJECT_ID}/${WINGERX_ARTIFACT_REPOSITORY}/wingerx-crm:latest"

gcloud config set project "${WINGERX_PROJECT_ID}"
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com
```

Create the Docker repository once:

```bash
gcloud artifacts repositories create "${WINGERX_ARTIFACT_REPOSITORY}" \
  --repository-format=docker \
  --location="${WINGERX_REGION}" \
  --description="WingerX production images"
```

If the repository already exists, do not create it again.

## 2. Build the application image

Build through Cloud Build instead of on the small VM. From a clean clone of
the repository:

```bash
git clone https://github.com/avinashbuddana/wingerxCrm.git
cd wingerxCrm

gcloud builds submit \
  --config=cloudbuild.gcp-vm.yaml \
  --substitutions="_IMAGE_URI=${WINGERX_IMAGE_URI}" \
  .
```

The build pushes the production image to Artifact Registry. If Cloud Build
reports an Artifact Registry permission error, grant its displayed build
service account the `Artifact Registry Writer` role and retry.

## 3. Create the static IP, firewall rule and VM

```bash
gcloud compute addresses create wingerx-ip --region="${WINGERX_REGION}"
export WINGERX_STATIC_IP="$(gcloud compute addresses describe wingerx-ip --region="${WINGERX_REGION}" --format='value(address)')"

gcloud compute firewall-rules create wingerx-web \
  --network=default \
  --allow=tcp:80,tcp:443 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=wingerx-web

gcloud compute instances create "${WINGERX_VM_NAME}" \
  --zone="${WINGERX_ZONE}" \
  --machine-type=e2-small \
  --image-family=ubuntu-2404-lts-amd64 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-standard \
  --address="${WINGERX_STATIC_IP}" \
  --tags=wingerx-web \
  --scopes=cloud-platform
```

Grant the VM's service account read access to Artifact Registry:

```bash
export WINGERX_VM_SERVICE_ACCOUNT="$(gcloud compute instances describe "${WINGERX_VM_NAME}" --zone="${WINGERX_ZONE}" --format='value(serviceAccounts[0].email)')"

gcloud projects add-iam-policy-binding "${WINGERX_PROJECT_ID}" \
  --member="serviceAccount:${WINGERX_VM_SERVICE_ACCOUNT}" \
  --role=roles/artifactregistry.reader
```

## 4. Point the domain to the VM

At the domain's DNS provider, create an `A` record:

```text
Name: crm
Value: the WINGERX_STATIC_IP value
TTL: 300
```

For `crm.example.com`, set both `DOMAIN=crm.example.com` and
`SERVER_URL=https://crm.example.com` in the environment file. Caddy requests
the HTTPS certificate automatically after DNS reaches the VM.

## 5. Install Docker and prepare swap

Connect with Compute Engine SSH and run:

```bash
sudo apt-get update
sudo apt-get install -y curl docker.io docker-compose-v2 git python3
sudo systemctl enable --now docker

sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

sudo usermod -aG docker "$(whoami)"
```

Disconnect and reconnect to SSH once so the Docker group membership applies.
Create swap only once.

## 6. Pull the deployment configuration

```bash
sudo mkdir -p /opt/wingerx
sudo chown "$(id -u):$(id -g)" /opt/wingerx
git clone --depth=1 https://github.com/avinashbuddana/wingerxCrm.git /opt/wingerx/repo
cd /opt/wingerx/repo/deploy/gcp-vm
cp .env.example .env
chmod 600 .env
```

Authenticate Docker to Artifact Registry from the VM identity. This uses the
short-lived access token from the Compute Engine metadata service and does not
store a service-account key:

```bash
export WINGERX_REGISTRY="asia-south1-docker.pkg.dev"

curl --fail --silent --show-error \
  --header 'Metadata-Flavor: Google' \
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])' \
  | docker login --username oauth2accesstoken --password-stdin "https://${WINGERX_REGISTRY}"
```

## 7. Configure the environment

Generate three different values:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
```

Edit the environment file:

```bash
nano /opt/wingerx/repo/deploy/gcp-vm/.env
```

Use the three generated values for `APP_SECRET`, `ENCRYPTION_KEY` and
`PG_DATABASE_PASSWORD`. Also set the real domain, image URI, Brevo SMTP values
and Meta WhatsApp values. Any additional Twenty environment variables placed in
this file are passed to both the server and worker. Never commit this file.

The Compose configuration builds these private connections automatically:

```text
PostgreSQL: postgresql://<user>:<password>@postgres:5432/<database>
Redis:      redis://redis:6379
```

Do not publish ports 5432 or 6379 in the GCP firewall or Docker Compose.

## 8. Start and verify WingerX

```bash
cd /opt/wingerx/repo/deploy/gcp-vm
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 server worker caddy
```

After the server and worker show healthy/running, open the configured HTTPS
domain and create the initial admin workspace. Then verify:

1. `/wingerx` loads after login.
2. Sales dashboard data can be read.
3. An automation creates a task and skips its duplicate on a second run.
4. A test email is queued through Brevo.
5. A consented WhatsApp template is accepted by Meta.

## 9. Deploy updates

Build the new image from Cloud Shell using step 2, then run on the VM:

```bash
export WINGERX_REGISTRY="asia-south1-docker.pkg.dev"

curl --fail --silent --show-error \
  --header 'Metadata-Flavor: Google' \
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token' \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])' \
  | docker login --username oauth2accesstoken --password-stdin "https://${WINGERX_REGISTRY}"

cd /opt/wingerx/repo
git pull --ff-only
cd deploy/gcp-vm
docker compose pull
docker compose up -d
docker image prune -f
```

Do not change `APP_SECRET` or `ENCRYPTION_KEY` during normal deployments.
Do not run `docker compose down --volumes`; that command deletes the named data
volumes used by PostgreSQL, Redis and local attachments.
