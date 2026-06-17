#!/usr/bin/env bash
API="http://localhost:8001/api"

# Register
echo "=== 1. Inscription ==="
REG=$(curl -s -X POST "$API/auth/register" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"name":"Visu Demo","email":"visu@demo.local","password":"Password123!","password_confirmation":"Password123!"}')
echo "$REG" | python3 -m json.tool
TOKEN=$(echo "$REG" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

echo ""
echo "=== 2. Mon profil (avec token) ==="
curl -s "$API/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool

echo ""
echo "=== 3. Déconnexion ==="
curl -s -X POST "$API/auth/logout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool

echo ""
echo "=== 4. Vérification : profil après logout (doit échouer) ==="
curl -s "$API/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | python3 -m json.tool
