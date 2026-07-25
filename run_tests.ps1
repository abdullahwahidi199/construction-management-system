$ErrorActionPreference = "Stop"

Push-Location backend
try {
  if (Get-Command coverage -ErrorAction SilentlyContinue) {
    coverage run manage.py test
    coverage report
    coverage html
  } else {
    python manage.py test
  }
}
finally {
  Pop-Location
}

Push-Location frontend
try {
  npm run test -- --coverage
  npm run build
}
finally {
  Pop-Location
}
