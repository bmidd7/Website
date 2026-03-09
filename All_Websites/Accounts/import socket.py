import socket

s = socket.socket()
try:
    s.connect(("192.168.4.28", 1883))
    print("TCP connection succeeded")
except Exception as e:
    print("TCP connection failed:", e)
finally:
    s.close()