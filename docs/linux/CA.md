## 1. 数字签名

数字签名在加密领域是用来进行消息签名和验证消息签名的技术，目的是用来验证消息的真实性。

数字签名的应用非常广泛，特别是在金融领域（比如银行转账）。在加密货币领域，数字签名技术一般会用于转账交易，简单来说，比如A给B发送1个比特币，为了确保转账的真实性和安全，比特币转出方，会把交易信息做一个数字签名，来证明确实是由A转给B一个比特币，然后广播给全网。

### 1.  工作原理

首先数字签名依赖一个公钥加密系统，也就是它需要有一对公钥私钥。签名和验证的基本过程如下： 

![1682162098258](images/1682162098258.png)

#### 1. 签名过程（签名由私钥持有方发起）

1. 首先准备一个要发送的明文消息
2. 通过哈希算法，把这条明文消息转成哈希值
3. 使用私钥对这个哈希值进行签名
4. 把明文消息连同签名发送给公钥持有方

#### 2. 验证过程（公钥持有方进行签名验证）

1. 收到原始明文信息，对其进行哈希，取得哈希值H1
2. 通过公钥对签名消息进行解密，取得哈希值H2
3. 比较H1和H2，如果相等，则证明发送信息者，确实为私钥拥有方。

### 2. 常用的数字签名算法

 常用的数字签名算法有`RSA`，`DSA`，`ECDSA`，`EdDSA`等

## 2. 数字证书（Digital Certificates）

证书是一个在数字世界里用来认证用户或者设备的技术，由一些受信任的机构签发一个特殊的“文件”来证明一个秘钥属于特定的用户和设备，用户和设备从而可以使用该认证过的秘钥来代表自己的身份，进行消息的传递。

这种用来签发证书的机构，我们称之为certificate authority (CA)，经由它签发的“文件”我们称之为certificate证书。

我们签名讲过的数字签名在PKI中扮演非常重要的角色，certificate证书的内容是什么？CA是怎么签发证书的呢？

certificate证书其实是一种特殊的签名，我们知道数字签名可以验证身份，但是前提是对方有你的公钥，所以公钥的分发非常关键，如何证明这个公钥就是你的呢？答案是，找一个大家都信任的机构（CA）给你的公钥进行签名，获取到证书，别人收到就信任你的公钥了。

比如在我们的系统中，一般都内置了一些受信任的机构的公钥，只要收到这些机构的签名数据，我们很容易就可以验证数据的真假。

 证书包含以下内容 ：

1. 证书拥有者的基本信息，（比如HTTPS证书的话，包括拥有者的域名CNAME，公司或者组织名称，地点等）
2. 证书颁发者的基本信息
3. 证书拥有者的公钥
4. 对公钥和其他信息的签名 

![1682162825687](images/1682162825687.png)

## 3. openssl生成自签名证书

不经过CA，自己通过自己的私钥进行签名产生证书

因为是自签名，所以我们需要自己扮演CA，作为CA颁发证书的机构，需要准备：

1. 一对公钥私钥public key，private key
2. 把公钥包装成证书的格式，分发出去，在现实中，这些CA的证书（或者叫根证书）一般都已经包含在操作系统中了。

### 1. 生成CA证书

#### 1. 创建CA私钥

```bash
ubuntu@ubuntu:~/ca$ openssl genrsa -out ca.key -des3 2048
Generating RSA private key, 2048 bit long modulus (2 primes)
..........................................................................+++++
........................................................+++++
e is 65537 (0x010001)
Enter pass phrase for ca.key:    # 输入密码：123456
Verifying - Enter pass phrase for ca.key:    # 输入密码：123456
ubuntu@ubuntu:~/ca$ ls
ca.key
```

`-des3`：使用des3算法对私钥进行加密。

```bash
ubuntu@ubuntu:~/ca$ cat ca.key 
-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,F526BBC32DB83B32

8cgYjD+RrZx29x2kvJhw7hHWWROs6YDpU+bCMC6eR8FlboeMXmNAKdr/+74iKSug
iHwelqLPDdeyo/27aySkbgWr6wv2BZZvx7B7Mju9TrKAQ18+uIZMLSG36frBtLXD
S59wUdEO1R0Y1pey66qSd7d3SaiV/gau1J4fvwNgp1DAOnePiZTOO0ekFSdxO+sH
qbjXGBstwJLvxAo0mhbp0H9oHWXoLPT3iNeESsGezX+sEyk5y7hXyXfHg2+sQcRb
607hQ8/rjcdtMFzA4GkYjC9PPzBf/+vizlf4Frt4gM3TtyzKRcKTLa9VhA7EGtf6
4ktyI1o+bKQrHSvuwRhNNg0YxgQZCmlVm2iisKBIPccCNgPcfH3KJdK0OpG4nstS
3Yutl4PmxbueSrg/P5cpQjor1B/atCime6bPfYITZhCY9mm9ULNxL+AJNMpb0dbG
hXcRG31P8tucysSNntPAElCQ+6h0XmmkNGoFFiD2d6Y7fl3gYmigo8OHI1bbGoXT
iw59A0/y90faRwmLOFWXJxVvBDSuekf7UOJRHLarzSyoug7r/zWmdW9F/NrRZMlX
GXsZ1SPeJx996LpE0/XkaTehFage6Q8zzFEcbBFoH1Z0Ru712d3NQx/10om8Z9sA
6znm/CoVM0spnYvGeyjEyLBVCclGG+sFJQ306/WwtvgNGkOohFG5ZqVpX8qrvUQV
9+4ZK6YMd6JLsli7aU4YJ3CbREakP81ygTepT6wzO7L9uEDg56Bjsrejd5glZSV5
MRlOqnGicQUx6oeHXjy+MYocxeYsXyMNV0WmbcJLXScGjCfhkOkUbp1LkHC0HC7P
Izgy7jTexFLD+iExUr7tSfUvV4mD/b8Eebr+5zEBDAnoVAQH+mVFHvUPNxKsWWj8
gBkv8ciZQ/NozzS73RLzYXMExxq96dxuTZkQgjTGWgJl/GtZggw9wvmfWJnO5Qyf
3FZW9nO827HIRCzZpuWZatkcjksqo9Z2+SHoI9gdxXAWWa0PN1VKfKBEmkb7elf/
tY7JWS6kumD/1Qkns6IFVwWeZOxTv6jq6YIzPXWIjKiF3uzX5pRe2PHjr3Tujneb
ituMq60PX+xnXX3w8//GbNaN7POg+7VgyTST26DwoPoFlKh1yLPw2cOLqfG1D4iJ
l0spUtN5tLgQwPNssXpONIrP148WBga741jPuSUBRkxZMhRgPh6XOenK1Kpnp+cu
BZZxugfWyX3yWJxILZkqWqkx5NSrh9ofkjk/7UGwgYLWwpBzHPFpPcFfVD6HWwAB
YpJr20BqhhsFq37yyBI4+WMwtYKicatd0vIE6Xwt5VxrcgyoyQl5qL/GEBTVi1I2
fNqbs4D3PlaXzZqrTlMhCXdZgrjJHU6WmLXreBpuym1RCYTDO9+MEzVKmlGQZGEE
zuP3ket3paJ7C+WnDclU9OLplOVxNXvmeO58ICycmR85jVFUazOJWH8T8QCc5PtU
D+5qHZYOcecwsZ/FzOaFCNecl7DThMOZdpxY0KWNeCogrDKyrsxkTvIkGMymX74w
/0H/19ySdj9bPmPPp28V2PUvEqvwr6dbhl0K4CDU+GPLp5OnNjM5Y/HYBvEYxa1F
-----END RSA PRIVATE KEY-----
```

#### 2. 生成CA根证书

```bash
ubuntu@ubuntu:~/ca$ openssl rand -writerand  /home/ubuntu/.rnd
ubuntu@ubuntu:~/ca$ openssl req -x509 -key ca.key -out ca.crt -days 365
Enter pass phrase for ca.key:    # 输入密码：123456
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:CN
State or Province Name (full name) [Some-State]:BeiJing
Locality Name (eg, city) []:BeiJing
Organization Name (eg, company) [Internet Widgits Pty Ltd]:RootCA
Organizational Unit Name (eg, section) []:RootCA
Common Name (e.g. server FQDN or YOUR name) []:www.rootca.com
Email Address []:admin@rootca.com
ubuntu@ubuntu:~/ca$ ls
ca.crt  ca.key

```

查看证书内容

```bash
ubuntu@ubuntu:~/ca$ openssl x509 -in ca.crt -text -noout
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
            2a:10:79:8b:79:30:dc:c2:63:d7:10:00:ec:20:22:98:ba:93:07:95
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = CN, ST = BeiJing, L = BeiJing, O = RootCA, OU = RootCA, CN = www.rootca.com, emailAddress = admin@rootca.com
        Validity
            Not Before: Apr 22 11:54:35 2023 GMT
            Not After : Apr 21 11:54:35 2024 GMT
        Subject: C = CN, ST = BeiJing, L = BeiJing, O = RootCA, OU = RootCA, CN = www.rootca.com, emailAddress = admin@rootca.com
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:ef:3d:f2:5a:53:f5:ad:11:20:e3:81:14:1f:fe:
                    a7:14:d0:1d:c7:fc:d4:6b:9f:5e:7e:95:8d:a7:38:
                    c7:8b:30:ab:79:6c:9c:14:57:b6:a7:19:d6:b5:cb:
                    37:e0:17:5d:b3:ba:15:74:81:2a:73:25:95:49:13:
                    ff:fb:f9:c8:f5:11:17:16:b1:ba:20:4e:92:48:17:
                    2c:56:3a:d3:11:2e:1e:c9:ff:90:06:aa:44:bc:2b:
                    ff:fc:03:6e:b7:26:89:30:22:a9:c6:38:c5:4a:4e:
                    25:b5:63:95:a9:d9:b0:1b:35:59:aa:08:00:42:dd:
                    a4:8e:2b:6a:75:da:24:31:c5:56:2a:31:4b:9c:0a:
                    77:2a:b4:4b:a4:11:c5:7c:6d:ad:57:f2:e8:71:8e:
                    79:2e:63:a5:8e:7f:0c:24:96:b3:2a:26:fa:13:aa:
                    50:df:0c:e8:c4:5b:bc:04:3b:cc:78:d1:5e:73:81:
                    3e:fc:86:3b:7f:e1:e0:a8:eb:a8:e8:8a:79:d0:18:
                    41:6a:50:41:d9:f8:d1:0a:2f:2d:9f:c7:af:cc:13:
                    80:44:e0:c9:0c:4e:08:93:9d:63:39:29:7c:a6:68:
                    a3:7d:95:06:af:e0:f5:6c:02:8f:85:58:ba:39:54:
                    a3:6d:6d:19:fb:e6:33:de:3d:07:f3:44:22:62:03:
                    a3:b3
                Exponent: 65537 (0x10001)
        X509v3 extensions:
            X509v3 Subject Key Identifier: 
                27:A2:9C:C7:A2:0C:F1:EF:D5:3C:DA:90:D2:10:0B:D0:6C:B1:15:7B
            X509v3 Authority Key Identifier: 
                keyid:27:A2:9C:C7:A2:0C:F1:EF:D5:3C:DA:90:D2:10:0B:D0:6C:B1:15:7B

            X509v3 Basic Constraints: critical
                CA:TRUE
    Signature Algorithm: sha256WithRSAEncryption
         07:01:c2:c8:54:45:d0:84:af:34:de:73:f4:20:fe:06:98:f8:
         87:62:57:77:d6:c5:2b:15:93:88:f0:31:c4:2e:12:89:e1:eb:
         bf:c9:da:c1:f7:6a:39:eb:0b:a1:aa:63:b7:97:25:66:75:1e:
         fd:81:b3:07:3d:91:de:f8:d5:bb:02:51:63:91:1c:66:d4:3e:
         72:ef:2b:5d:ea:fa:7b:96:85:48:ac:d9:07:ec:ba:df:a4:bb:
         1c:5d:8e:e8:52:7a:6d:f6:b6:77:6e:43:9f:5a:bc:b2:ae:39:
         85:95:d4:1c:7d:0e:bc:26:7b:c7:c6:62:0f:fc:8a:71:88:07:
         69:7e:f1:e7:2d:36:f0:30:30:26:e4:70:1f:9c:fe:2c:c3:a5:
         62:9f:6f:74:ce:58:10:4f:ec:92:df:30:88:b8:11:f2:51:ca:
         14:72:af:13:e1:b6:e8:f7:eb:9d:20:08:35:33:47:dc:63:c9:
         c5:72:31:16:0d:d4:f2:f3:c4:93:97:9f:8d:56:07:53:1f:b3:
         82:44:b7:5e:a1:a8:1b:10:46:ac:39:96:dc:1c:90:4b:e7:fa:
         b2:f8:57:a2:6a:7f:85:53:94:ef:2c:93:de:45:0f:26:99:bd:
         14:1e:35:19:ce:70:af:ae:2e:0d:5e:b9:bd:56:04:29:e8:83:
         6e:9d:46:dc
```

### 2. 服务器端证书

#### 1. 生成私钥

```bash
ubuntu@ubuntu:~/site$ openssl genrsa -out server.key 2048
Generating RSA private key, 2048 bit long modulus (2 primes)
...................................................................+++++
............................+++++
e is 65537 (0x010001)
ubuntu@ubuntu:~/site$ ls
server.key
```

从私钥中抽取公钥

```bash
ubuntu@ubuntu:~/site$ openssl rsa -in server.key -pubout 
writing RSA key
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz3mBKdAnFVHRwBBQQosk
lnROb+VjD1ZZgGGqCbNxe/6DTNeJrCNnkhI6q0oKHWkzfa02VfoRxceUxCxhOnVQ
w54WEzcqVdlPYeruWbSusmq8etWKVILa1RXVUzpE0tZyg8YI5vdyoX8Pj3NfKhP9
FuSXKqf2CfMCwocrPtMh0zhUIaTUXk1yJShn1+0MEl+0dBUsl0ANqHGvD1cBuYBS
XaxDcAAWsqI56nctOAY135eNVLs8Fq+E+Q3knJ8/b/tTS4K2fDtatpctu1kKWoHp
nwQgBGaRHtUOOHVdS4UBhox7nO1fuZHiNPY+VFTm/unaNY+VHSIscTqsY7BsD7Ao
KwIDAQAB
-----END PUBLIC KEY-----
```



#### 2. 生成签名请求

```bash
ubuntu@ubuntu:~/site$ openssl req -new -key server.key -out server.csr
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:CN
State or Province Name (full name) [Some-State]:BeiJing
Locality Name (eg, city) []:BeiJing
Organization Name (eg, company) [Internet Widgits Pty Ltd]:example
Organizational Unit Name (eg, section) []:dev
Common Name (e.g. server FQDN or YOUR name) []:www.example.com
Email Address []:admin@example.com

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
ubuntu@ubuntu:~/site$ ls
server.csr  server.key
```

或者

```bash
openssl req -new -key server.key -out server.csr -subj "/C=CN/ST=BeiJing/L=BeiJing/O=example/OU=dev/CN=www.example.com/emailAddress=admin@example.com"
```

查看请求内容

```bash
ubuntu@ubuntu:~/site$ openssl req -text -in server.csr -verify -noout 
verify OK
Certificate Request:
    Data:
        Version: 1 (0x0)
        Subject: C = CN, ST = BeiJing, L = BeiJing, O = example, OU = dev, CN = www.example.com, emailAddress = admin@example.com
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:cf:79:81:29:d0:27:15:51:d1:c0:10:50:42:8b:
                    24:96:74:4e:6f:e5:63:0f:56:59:80:61:aa:09:b3:
                    71:7b:fe:83:4c:d7:89:ac:23:67:92:12:3a:ab:4a:
                    0a:1d:69:33:7d:ad:36:55:fa:11:c5:c7:94:c4:2c:
                    61:3a:75:50:c3:9e:16:13:37:2a:55:d9:4f:61:ea:
                    ee:59:b4:ae:b2:6a:bc:7a:d5:8a:54:82:da:d5:15:
                    d5:53:3a:44:d2:d6:72:83:c6:08:e6:f7:72:a1:7f:
                    0f:8f:73:5f:2a:13:fd:16:e4:97:2a:a7:f6:09:f3:
                    02:c2:87:2b:3e:d3:21:d3:38:54:21:a4:d4:5e:4d:
                    72:25:28:67:d7:ed:0c:12:5f:b4:74:15:2c:97:40:
                    0d:a8:71:af:0f:57:01:b9:80:52:5d:ac:43:70:00:
                    16:b2:a2:39:ea:77:2d:38:06:35:df:97:8d:54:bb:
                    3c:16:af:84:f9:0d:e4:9c:9f:3f:6f:fb:53:4b:82:
                    b6:7c:3b:5a:b6:97:2d:bb:59:0a:5a:81:e9:9f:04:
                    20:04:66:91:1e:d5:0e:38:75:5d:4b:85:01:86:8c:
                    7b:9c:ed:5f:b9:91:e2:34:f6:3e:54:54:e6:fe:e9:
                    da:35:8f:95:1d:22:2c:71:3a:ac:63:b0:6c:0f:b0:
                    28:2b
                Exponent: 65537 (0x10001)
        Attributes:
            a0:00
    Signature Algorithm: sha256WithRSAEncryption
         b7:b2:80:b6:29:53:46:61:a5:23:ba:d6:60:b7:b2:cf:a0:fd:
         cb:4d:25:50:9a:f0:b8:3e:e8:77:db:7f:f1:6a:fd:74:76:cc:
         81:a5:34:cc:50:31:51:37:42:c2:ec:c3:71:1c:16:1e:5e:00:
         e9:07:9d:07:7b:21:f6:4e:47:6e:02:2d:54:68:83:d3:bc:e4:
         bf:1b:4e:32:c1:79:a7:79:3c:32:d7:10:ef:10:3c:1b:4d:5f:
         ea:79:47:46:6c:48:68:98:50:da:cc:a4:c4:39:03:03:a1:37:
         bb:47:44:92:d6:5f:99:9c:43:44:c0:79:2f:11:a1:d7:0a:6d:
         d7:ef:d5:c7:a5:02:eb:7d:c6:d4:6b:72:8c:03:ac:9e:77:ee:
         ce:a4:df:88:8b:a5:d0:3d:f1:e3:d5:29:05:cd:f8:6c:22:1f:
         6f:bd:66:72:91:31:72:f2:78:8d:80:ef:48:86:81:54:71:fe:
         8d:c9:0c:0c:f2:18:26:5a:f4:60:92:54:64:84:7b:1f:87:8a:
         b5:8d:c7:c6:f4:ec:47:61:76:b8:24:1f:b4:c3:5d:84:bd:da:
         9a:61:6c:ae:26:fb:fe:7a:ca:df:4e:e9:df:9e:87:48:e8:58:
         2a:c1:ee:34:32:39:13:41:d1:0f:da:44:8b:cb:24:a9:fa:90:
         02:d3:56:84
```

#### 3. 生成服务器证书

```bash
ubuntu@ubuntu:~/site$ openssl x509 -req -in server.csr -CA ../ca/ca.crt -CAkey ../ca/ca.key -CAcreateserial -out server.crt -days 365
Signature ok
subject=C = CN, ST = BeiJing, L = BeiJing, O = example, OU = dev, CN = www.example.com, emailAddress = admin@example.com
Getting CA Private Key
Enter pass phrase for ../ca/ca.key:
ubuntu@ubuntu:~/site$ ls
server.crt  server.csr  server.key
```

查看证书内容

```bash
ubuntu@ubuntu:~/site$ openssl x509 -in server.crt -text -noout 
Certificate:
    Data:
        Version: 1 (0x0)
        Serial Number:
            70:8f:17:fa:48:1d:07:eb:12:90:00:b6:12:e7:17:9f:7c:43:a0:6c
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C = CN, ST = BeiJing, L = BeiJing, O = RootCA, OU = RootCA, CN = www.rootca.com, emailAddress = admin@rootca.com
        Validity
            Not Before: Apr 22 12:19:52 2023 GMT
            Not After : Apr 21 12:19:52 2024 GMT
        Subject: C = CN, ST = BeiJing, L = BeiJing, O = example, OU = dev, CN = www.example.com, emailAddress = admin@example.com
        Subject Public Key Info:
            Public Key Algorithm: rsaEncryption
                RSA Public-Key: (2048 bit)
                Modulus:
                    00:cf:79:81:29:d0:27:15:51:d1:c0:10:50:42:8b:
                    24:96:74:4e:6f:e5:63:0f:56:59:80:61:aa:09:b3:
                    71:7b:fe:83:4c:d7:89:ac:23:67:92:12:3a:ab:4a:
                    0a:1d:69:33:7d:ad:36:55:fa:11:c5:c7:94:c4:2c:
                    61:3a:75:50:c3:9e:16:13:37:2a:55:d9:4f:61:ea:
                    ee:59:b4:ae:b2:6a:bc:7a:d5:8a:54:82:da:d5:15:
                    d5:53:3a:44:d2:d6:72:83:c6:08:e6:f7:72:a1:7f:
                    0f:8f:73:5f:2a:13:fd:16:e4:97:2a:a7:f6:09:f3:
                    02:c2:87:2b:3e:d3:21:d3:38:54:21:a4:d4:5e:4d:
                    72:25:28:67:d7:ed:0c:12:5f:b4:74:15:2c:97:40:
                    0d:a8:71:af:0f:57:01:b9:80:52:5d:ac:43:70:00:
                    16:b2:a2:39:ea:77:2d:38:06:35:df:97:8d:54:bb:
                    3c:16:af:84:f9:0d:e4:9c:9f:3f:6f:fb:53:4b:82:
                    b6:7c:3b:5a:b6:97:2d:bb:59:0a:5a:81:e9:9f:04:
                    20:04:66:91:1e:d5:0e:38:75:5d:4b:85:01:86:8c:
                    7b:9c:ed:5f:b9:91:e2:34:f6:3e:54:54:e6:fe:e9:
                    da:35:8f:95:1d:22:2c:71:3a:ac:63:b0:6c:0f:b0:
                    28:2b
                Exponent: 65537 (0x10001)
    Signature Algorithm: sha256WithRSAEncryption
         db:b7:f9:32:28:45:29:14:04:e2:49:87:b8:9c:4f:33:2d:ef:
         5f:54:04:9c:2e:c0:f7:64:9c:ea:e0:14:96:c8:08:6f:6a:42:
         9c:73:d9:35:3c:79:0f:57:7f:ae:36:d1:f2:99:fb:40:54:97:
         93:a4:5e:d0:a1:fb:a6:e7:8a:7b:2b:23:ba:69:31:30:06:76:
         19:88:e3:ed:5a:25:b7:32:00:e3:04:2a:52:23:c0:91:e2:5e:
         c6:88:ee:22:4a:08:f4:b9:93:82:15:fe:6c:01:c8:66:fe:7d:
         30:06:4a:48:a2:88:14:2f:09:dc:0c:04:41:c6:d9:a6:12:4d:
         de:cf:e0:9f:21:aa:70:e6:8d:f4:c8:8f:4b:8d:a2:36:23:63:
         4a:d4:c8:5d:22:9b:45:9a:0e:ed:1a:03:3d:33:ed:d6:4f:c2:
         93:ea:9d:5b:1a:6a:7f:d5:9b:78:c3:f6:38:66:9f:84:8f:66:
         0d:4d:6a:22:46:02:1b:64:21:00:36:32:26:85:ee:d9:85:3e:
         38:85:1a:1b:b8:8c:33:e5:84:dc:bf:09:19:1c:95:f9:b8:24:
         0c:df:54:72:df:24:80:3f:35:f0:a8:03:27:a0:82:85:7f:f3:
         bb:5e:72:1e:22:b2:b4:ac:e6:40:6a:d1:16:e2:0e:e4:17:76:
         1f:b6:6a:31
```



