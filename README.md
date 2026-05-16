## 选择建议
`GrainTCP/snippets.js` + `!txt+https.js`  
或自行测试选择更适合自己的  

---
## 文件说明  
* **snippets.js**：支持 `!txt/socks5/http/https/sstp/turn`，这个 https 非完全体，不支持 IP  
* **!txt.js**：支持 `!txt`  
* **!txt+https.js**：支持 `!txt/https`，这个 https 是完全体，支持 IP 跳过验证  
* **!txt+sstp+turn.js**：支持 `!txt/sstp/turn`  
* 根目录下为 **vless**，**trojan**/**ss** 在对应文件夹，文件夹 **AK** 为 AK 源码备份  
**总结**：文件名即支持的功能，除`snippets.js` 外都已移除 `socks/http`  

---
## 功能说明  
1. **!txt**：通过标记 `!txt` 支持采用 TXT 记录的反代域名，比如CM群里的威廉的反代域名 [*.william.us.ci!txt](https://t.me/CMLiussss_channel/84)  
2. **https**：https 代理完全体，无正常证书的通过标记 `!ip` 支持跳过证书，见 [AK说明](https://t.me/Enkelte_notif/817)  
3. **sstp**：见 [AK说明](https://t.me/Enkelte_notif/819)  
4. **turn**：见 [AK说明](https://t.me/Enkelte_notif/805)  
**总结**：这些功能解决的是CF节点的落地问题，可以实现**无限家宽全球落地**  
**本项目适合对CF节点有一定理解基础的同学，需手搓节点，以需跳过证书验证的 https 代理为例：**  
```
vless://495c7195-85b8-498a-bf20-2ea9ce9175b5@www.shopify.com:443?path=%2F%3Fed%3D2560%26fdip%3Dhttps%3A%2F%2F1.2.3.4%3A443%21ip&security=tls&encryption=none&insecure=0&host=https.snippets.cf&fp=random&type=ws&allowInsecure=0&sni=https.snippets.cf#https
```
**路径示例：**
```
!txt: /?ed=2560&fdip=*.william.us.ci!txt
https 域名: /?ed=2560&fdip=https://domain:port
https IP: /?ed=2560&fdip=https://ip:port!ip
sstp: /?ed=2560&fdip=sstp://host:port
turn: /?ed=2560&fdip=turn://host:port
特别地，ss节点路径需加上UUID，如：!txt: /{uuid}?ed=2560&fdip=*.william.us.ci!txt
```

---
## 特别提醒  
**1101请全删旧片段再部署。已有正常运行中的片段需谨慎，部署新片段会触发全部片段代码检测。**  
**有问题请开 issue 或联系 [tg bot](https://t.me/meindmBot)**

---
## 鸣谢  
**代码来自 [老王](https://github.com/eooce/Cloudflare-proxy/blob/main/snippets.js)、[CM](https://github.com/cmliu/edgetunnel)、[AK](https://t.me/Enkelte_notif) 等大佬**
