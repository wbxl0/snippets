## 文件说明
* `!txt.js`：支持 `!txt` 功能。  
* `!txt+https.js`：支持 `!txt` + `https` 功能，此 https 为完全体。  
* `snippets.js`：支持 `!txt` + `socks5` + `http` + `https` + `sstp` + `turn` 功能，此 https 非完全体。  
* `*_ss.js`：为 shadowsocks 版，不带 _ss 尾标为 vless 版。  

---
## 功能说明
1. **!txt**：通过标记 `!txt` 支持采用 TXT 记录的反代域名、https等协议代理域名，比如CM群里的威廉的反代域名 [*.william.us.ci!txt](https://t.me/CMLiussss_channel/84)、https://https.example.com!txt  
2. **https**：完全体支持 `https://host:port` 和 `https://ip:port!ip`，非完全体仅支持 `https://host:port`，见 [AK说明](https://t.me/Enkelte_notif/817)  
3. **sstp**：小日子大学的个人志愿者公益家宽，见 [AK说明](https://t.me/Enkelte_notif/819)  
4. **turn**：见 [AK说明](https://t.me/Enkelte_notif/805)  
**总结**：这些功能解决的是CF节点的落地问题，可以实现**无限家宽全球落地**  
**注**：TXT 内容格式以 `,` 分隔或换行或两者混用。作用逻辑：获取域名 TXT 记录内容，取其中某个反代 ip:port 或协议代理 sstp://host:port（以sstp为例）使用  

**路径示例：**
```
1. !txt:
/?ed=2560&fdip=*.william.us.ci!txt
/?ed=2560&fdip={any}://https.example.com!txt
2. https:
域名: /?ed=2560&fdip=https://domain:port
IP: /?ed=2560&fdip=https://ip:port!ip
3. sstp: /?ed=2560&fdip=sstp://host:port
4. turn: /?ed=2560&fdip=turn://host:port
```
**节点示例：**
```
vless://495c7195-85b8-498a-bf20-2ea9ce9175b5@www.shopify.com:443?path=%2F%3Fed%3D2560%26fdip%3Dhttps%3A%2F%2F1.2.3.4%3A443%21ip&security=tls&encryption=none&insecure=0&host=https.snippets.cf&fp=random&type=ws&allowInsecure=0&sni=https.snippets.cf#https
ss://YWVzLTEyOC1nY206cGFzc3dvcmQ=@www.shopify.com:80/?plugin=v2ray-plugin%3Bmode%3Dwebsocket%3Bhost%3Dnotls.snippets.cf%3Bpath%3D%2F%3Fed%3D2560%26fdip%3Dproxyip.example.com#notls
```

---
## 特别提醒
**若1101请全删旧片段再部署，已有正常运行中的片段需谨慎，部署新片段会触发全部片段代码检测。**  
**有问题请开 issue 或联系 [tg bot](https://t.me/meindmBot)**  

---
## 鸣谢
**[老王](https://github.com/eooce/Cloudflare-proxy/blob/main/snippets.js)、[CM](https://github.com/cmliu/edgetunnel)、[AK](https://t.me/Enkelte_notif)、AI**
