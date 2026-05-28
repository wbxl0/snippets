`https://ip:port` 形式的 https 代理后加标记 !ip 以支持跳过验证，`https://domain:port` 形式的不用加  
```
vless://495c7195-85b8-498a-bf20-2ea9ce9175b5@www.shopify.com:443?path=%2F%3Fed%3D2560%26fdip%3Dhttps%3A%2F%2F1.2.3.4%3A443%21ip&security=tls&encryption=none&insecure=0&host=test.example.com&fp=firefox&type=ws&allowInsecure=0&sni=test.example.com#workers
```