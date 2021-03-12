c;Client
m;M-Site
h;H-Site
r;MHeadersRedirect\nController\n:genIsReqValid
rr;MHeadersRedirect\nController\n::genSuccResp
l;Log2hive

c>m
m>c;Go to h-site
c>"Ping!"h>r>"exposure"l
rr>"start_redirect"l
h.h
c>"Ping!"h>r>"invalid_param"l
rr>"start_redirect"l
h.h
