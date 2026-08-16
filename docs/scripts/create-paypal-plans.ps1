# PayPal Plan Creation Script
# Run this in PowerShell

$clientId = $env:NEXT_PUBLIC_PAYPAL_CLIENT_ID
$clientSecret = $env:PAYPAL_CLIENT_SECRET

if (-not $clientId -or -not $clientSecret) {
    Write-Host "❌ Error: PayPal credentials not found in environment variables" -ForegroundColor Red
    Write-Host "Make sure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 Getting PayPal access token..." -ForegroundColor Blue

# Get access token
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${clientId}:${clientSecret}"))
$headers = @{
    "Authorization" = "Basic $auth"
    "Content-Type" = "application/x-www-form-urlencoded"
}

try {
    $tokenResponse = Invoke-RestMethod -Uri "https://api-m.sandbox.paypal.com/v1/oauth2/token" -Method Post -Headers $headers -Body "grant_type=client_credentials"
    $accessToken = $tokenResponse.access_token
    Write-Host "✅ Access token obtained" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get access token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create products and plans
$apiHeaders = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# Master Product
Write-Host "📦 Creating Master Product..." -ForegroundColor Blue
$masterProduct = @{
    name = "NeuroNest Master"
    description = "Unlimited AI task breakdowns and premium features"
    type = "SERVICE"
    category = "SOFTWARE"
} | ConvertTo-Json

try {
    $masterProductResult = Invoke-RestMethod -Uri "https://api-m.sandbox.paypal.com/v1/catalogs/products" -Method Post -Headers $apiHeaders -Body $masterProduct
    Write-Host "✅ Master Product created: $($masterProductResult.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create Master Product: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Yellow
    exit 1
}

# Warrior Product  
Write-Host "📦 Creating Warrior Product..." -ForegroundColor Blue
$warriorProduct = @{
    name = "NeuroNest Warrior"
    description = "Everything in Master plus advanced analytics and priority support"
    type = "SERVICE"
    category = "SOFTWARE"
} | ConvertTo-Json

try {
    $warriorProductResult = Invoke-RestMethod -Uri "https://api-m.sandbox.paypal.com/v1/catalogs/products" -Method Post -Headers $apiHeaders -Body $warriorProduct
    Write-Host "✅ Warrior Product created: $($warriorProductResult.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create Warrior Product: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Master Plan
Write-Host "📋 Creating Master Plan ($6.99/month)..." -ForegroundColor Blue
$masterPlan = @{
    product_id = $masterProductResult.id
    name = "NeuroNest Master Monthly"
    description = "Monthly subscription to NeuroNest Master plan"
    status = "ACTIVE"
    billing_cycles = @(
        @{
            frequency = @{
                interval_unit = "MONTH"
                interval_count = 1
            }
            tenure_type = "REGULAR"
            sequence = 1
            total_cycles = 0
            pricing_scheme = @{
                fixed_price = @{
                    value = "6.99"
                    currency_code = "USD"
                }
            }
        }
    )
    payment_preferences = @{
        auto_bill_outstanding = $true
        setup_fee = @{
            value = "0"
            currency_code = "USD"
        }
        setup_fee_failure_action = "CONTINUE"
        payment_failure_threshold = 3
    }
    taxes = @{
        percentage = "0"
        inclusive = $false
    }
} | ConvertTo-Json -Depth 10

try {
    $masterPlanResult = Invoke-RestMethod -Uri "https://api-m.sandbox.paypal.com/v1/billing/plans" -Method Post -Headers $apiHeaders -Body $masterPlan
    Write-Host "✅ Master Plan created: $($masterPlanResult.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create Master Plan: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Warrior Plan
Write-Host "📋 Creating Warrior Plan ($9.99/month)..." -ForegroundColor Blue
$warriorPlan = @{
    product_id = $warriorProductResult.id
    name = "NeuroNest Warrior Monthly"
    description = "Monthly subscription to NeuroNest Warrior plan"
    status = "ACTIVE"
    billing_cycles = @(
        @{
            frequency = @{
                interval_unit = "MONTH"
                interval_count = 1
            }
            tenure_type = "REGULAR"
            sequence = 1
            total_cycles = 0
            pricing_scheme = @{
                fixed_price = @{
                    value = "9.99"
                    currency_code = "USD"
                }
            }
        }
    )
    payment_preferences = @{
        auto_bill_outstanding = $true
        setup_fee = @{
            value = "0"
            currency_code = "USD"
        }
        setup_fee_failure_action = "CONTINUE"
        payment_failure_threshold = 3
    }
    taxes = @{
        percentage = "0"
        inclusive = $false
    }
} | ConvertTo-Json -Depth 10

try {
    $warriorPlanResult = Invoke-RestMethod -Uri "https://api-m.sandbox.paypal.com/v1/billing/plans" -Method Post -Headers $apiHeaders -Body $warriorPlan
    Write-Host "✅ Warrior Plan created: $($warriorPlanResult.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create Warrior Plan: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 SUCCESS! Add these to your .env.local:" -ForegroundColor Green
Write-Host "PAYPAL_MASTER_PLAN_ID=$($masterPlanResult.id)" -ForegroundColor Yellow
Write-Host "PAYPAL_WARRIOR_PLAN_ID=$($warriorPlanResult.id)" -ForegroundColor Yellow

Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the plan IDs above to your .env.local file" -ForegroundColor White
Write-Host "2. Restart your development server" -ForegroundColor White
Write-Host "3. Test the subscription flow" -ForegroundColor White