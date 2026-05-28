`socks/http/https/sstp/turn` 等协议支持类似反代域名的 `!txt` 功能。例 `fdip=sstp://sstp.example.com!txt`。  
所有 `!txt` 功能支持要求 TXT 记录内容格式以 `,` 或换行分隔，或两者混合，TXT 内容不要太长。  
`fdip=sstp://sstp.example.com!txt` 实际可以是 `fdip={任意数字小写字母的组合}://{TXT内容为 socks/http/https/sstp/turn 中的一种或多种的域名}!txt`