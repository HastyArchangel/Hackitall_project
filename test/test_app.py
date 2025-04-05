import requests

url = "http://localhost:5000/simplify"

payload = {
    "text": "In the event that unforeseen circumstances arise, appropriate contingencies must be implemented to ensure operational continuity. While procedural deviations are discouraged, they may be authorized by supervisory personnel under exceptional conditions, provided that compliance with safety protocols is maintained at all times."
}

payload2 = {
    "text": "When I reflect on the course of my life, I cannot but lament my own vanity, in endeavoring to please my countrymen, by making them wiser and better, which, however, it was an honest intention, hath proved the very cause of my ruin. For, however, it hath been my good fortune to do some good, I am yet pursued with a perpetual resentment, for having presumed to censure the follies and corruptions of mankind."
}

response = requests.post(url, json=payload2)

print("Response:")
print(response.json())
