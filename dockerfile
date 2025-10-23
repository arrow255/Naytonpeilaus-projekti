FROM nginx:alpine
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./ssl/nginx-selfsigned.crt /etc/nginx/ssl/nginx-selfsigned.crt
COPY ./ssl/nginx-selfsigned.key /etc/nginx/ssl/nginx-selfsigned.key
EXPOSE 80 443
