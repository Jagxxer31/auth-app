ssh -i "key.pem" ubuntu@ec2-13-60-13-3.eu-north-1.compute.amazonaws.com
gunicorn -w 2 -b 0.0.0.0:5000 backend.flask_app:app
Stop app: sudo systemctl stop flaskapp
Restart app: sudo systemctl restart flaskapp
view logs: journalctl -u flaskapp -f
