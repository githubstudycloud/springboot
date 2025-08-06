## RabbitMQ 3.6 在 Docker 27 完整兼容启动方案

### 1. 基础兼容启动命令

```bash
docker run -d \
  --name rabbitmq36 \
  --restart unless-stopped \
  --security-opt seccomp=unconfined \
  --security-opt apparmor=unconfined \
  --cap-add=SYS_ADMIN \
  --privileged=false \
  -p 5672:5672 \
  -p 15672:15672 \
  -p 25672:25672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  -e RABBITMQ_LOGS=- \
  -e RABBITMQ_SASL_LOGS=- \
  -e RABBITMQ_LOG_BASE=/var/log/rabbitmq \
  -e RABBITMQ_CONSOLE_LOG=new \
  rabbitmq:3.6-management
```

### 2. 完整配置启动（推荐）

```bash
# 创建配置目录
mkdir -p ./rabbitmq36-data/config
mkdir -p ./rabbitmq36-data/data
mkdir -p ./rabbitmq36-data/logs

# 创建配置文件
cat > ./rabbitmq36-data/config/rabbitmq.config << 'EOF'
[
  {rabbit, [
    {loopback_users, []},
    {tcp_listeners, [5672]},
    {ssl_listeners, []},
    {default_user, <<"admin">>},
    {default_pass, <<"password">>},
    {log_levels, [{connection, info}]},
    {consumer_timeout, 86400000}
  ]},
  {rabbitmq_management, [
    {listener, [
      {port, 15672},
      {ssl, false}
    ]}
  ]},
  {kernel, [
    {inet_default_connect_options, [{delay_send, true}]}
  ]},
  {lager, [
    {handlers, [
      {lager_console_backend, info},
      {lager_file_backend, [
        {file, "/var/log/rabbitmq/rabbit.log"},
        {level, info}
      ]}
    ]}
  ]}
].
EOF

# 创建环境变量文件
cat > ./rabbitmq36-data/config/rabbitmq-env.conf << 'EOF'
RABBITMQ_LOGS=-
RABBITMQ_SASL_LOGS=-
RABBITMQ_CONSOLE_LOG=new
RABBITMQ_LOG_BASE=/var/log/rabbitmq
RABBITMQ_MNESIA_BASE=/var/lib/rabbitmq/mnesia
RABBITMQ_ENABLED_PLUGINS_FILE=/etc/rabbitmq/enabled_plugins
EOF

# 启用管理插件
cat > ./rabbitmq36-data/config/enabled_plugins << 'EOF'
[rabbitmq_management].
EOF

# 完整启动命令
docker run -d \
  --name rabbitmq36 \
  --restart unless-stopped \
  --hostname rabbitmq36-host \
  --security-opt seccomp=unconfined \
  --security-opt apparmor=unconfined \
  --cap-add=SYS_ADMIN \
  --ulimit nofile=65536:65536 \
  -p 5672:5672 \
  -p 15672:15672 \
  -p 25672:25672 \
  -v $(pwd)/rabbitmq36-data/config/rabbitmq.config:/etc/rabbitmq/rabbitmq.config:ro \
  -v $(pwd)/rabbitmq36-data/config/rabbitmq-env.conf:/etc/rabbitmq/rabbitmq-env.conf:ro \
  -v $(pwd)/rabbitmq36-data/config/enabled_plugins:/etc/rabbitmq/enabled_plugins:ro \
  -v $(pwd)/rabbitmq36-data/data:/var/lib/rabbitmq:rw \
  -v $(pwd)/rabbitmq36-data/logs:/var/log/rabbitmq:rw \
  -e RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  -e RABBITMQ_LOGS=- \
  -e RABBITMQ_SASL_LOGS=- \
  -e RABBITMQ_CONSOLE_LOG=new \
  rabbitmq:3.6-management
```

### 3. 故障排查启动命令

如果上面命令仍有问题，尝试这个更宽松的配置：

```bash
docker run -d \
  --name rabbitmq36-debug \
  --restart unless-stopped \
  --privileged \
  --pid=host \
  --security-opt seccomp=unconfined \
  --security-opt apparmor=unconfined \
  --security-opt label=disable \
  --cap-add=ALL \
  --ulimit nofile=65536:65536 \
  --ulimit memlock=-1:-1 \
  -p 5672:5672 \
  -p 15672:15672 \
  -p 25672:25672 \
  -e RABBITMQ_DEFAULT_USER=admin \
  -e RABBITMQ_DEFAULT_PASS=password \
  -e RABBITMQ_LOGS=- \
  -e RABBITMQ_SASL_LOGS=- \
  -e RABBITMQ_CONSOLE_LOG=new \
  -e RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG \
  rabbitmq:3.6-management
```

### 4. Docker Compose 版本

```yaml
# docker-compose.yml
version: '3.8'

services:
  rabbitmq36:
    image: rabbitmq:3.6-management
    container_name: rabbitmq36
    hostname: rabbitmq36-host
    restart: unless-stopped
    
    security_opt:
      - seccomp=unconfined
      - apparmor=unconfined
    
    cap_add:
      - SYS_ADMIN
    
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    
    ports:
      - "5672:5672"
      - "15672:15672" 
      - "25672:25672"
    
    volumes:
      - ./rabbitmq36-data/config/rabbitmq.config:/etc/rabbitmq/rabbitmq.config:ro
      - ./rabbitmq36-data/config/enabled_plugins:/etc/rabbitmq/enabled_plugins:ro
      - ./rabbitmq36-data/data:/var/lib/rabbitmq:rw
      - ./rabbitmq36-data/logs:/var/log/rabbitmq:rw
    
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=password
      - RABBITMQ_ERLANG_COOKIE=SWQOKODSQALRPCLNMEQG
      - RABBITMQ_LOGS=-
      - RABBITMQ_SASL_LOGS=-
      - RABBITMQ_CONSOLE_LOG=new

# 启动命令
# docker-compose up -d
```

### 5. 验证和监控命令

```bash
# 检查容器状态
docker ps -a | grep rabbitmq36

# 查看日志
docker logs -f rabbitmq36

# 检查端口
docker exec rabbitmq36 netstat -tlnp

# 进入容器
docker exec -it rabbitmq36 bash

# RabbitMQ管理命令
docker exec rabbitmq36 rabbitmqctl status
docker exec rabbitmq36 rabbitmqctl list_queues
docker exec rabbitmq36 rabbitmqctl list_users

# Web管理界面
# http://localhost:15672 (admin/password)
```

### 6. 关键兼容性参数说明

- `--security-opt seccomp=unconfined`: 禁用系统调用过滤
- `--security-opt apparmor=unconfined`: 禁用AppArmor限制
- `--cap-add=SYS_ADMIN`: 添加系统管理权限
- `--ulimit nofile=65536:65536`: 设置文件句柄限制
- `RABBITMQ_LOGS=-`: 强制日志输出到控制台

### 7. 如果仍然启动失败

```bash
# 1. 尝试使用更旧的Docker运行时
docker run --runtime=runc ...

# 2. 检查系统内核版本兼容性
uname -r

# 3. 尝试不同的基础镜像标签
docker run ... rabbitmq:3.6.16-management
docker run ... rabbitmq:3.6.15-management
```

推荐使用**方案2（完整配置启动）**，它提供了最佳的兼容性和可维护性。
