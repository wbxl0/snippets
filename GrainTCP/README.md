基于AK佬 [GrainTCP](https://github.com/ToiCF/GrainTCP)  
`socks/http/https/sstp/turn` 等协议支持类似反代域名的 `!txt` 功能。例 `fdip=sstp://sstp.example.com!txt`。  
所有 `!txt` 功能支持要求 TXT 记录内容格式为 `代理1,代理2,代理3~~`，TXT 内容不要太长。  