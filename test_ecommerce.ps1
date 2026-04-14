# E-Commerce Testing Script (PowerShell)
# Add products, test full flow

$API_URL = "https://490z9zcjr8.execute-api.ap-southeast-1.amazonaws.com"
$USER_ID = "user-123"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "E-Commerce System Test Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Body
    )

    $headers = @{ "Content-Type" = "application/json" }

    try {
        if ($Body) {
            $response = Invoke-WebRequest -Uri "$API_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -Body $Body `
                -UseBasicParsing
        } else {
            $response = Invoke-WebRequest -Uri "$API_URL$Endpoint" `
                -Method $Method `
                -Headers $headers `
                -UseBasicParsing
        }
        return $response.Content | ConvertFrom-Json
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Step 1: Add Sample Products
Write-Host "[Step 1] Adding Sample Products" -ForegroundColor Blue
Write-Host ""

$products = @(
    @{
        product_id = "LAPTOP-001"
        name = "MacBook Pro 16`""
        price = 2499.99
        description = "Powerful laptop for professionals"
        stock = 10
    },
    @{
        product_id = "PHONE-001"
        name = "iPhone 15 Pro"
        price = 1199.99
        description = "Latest Apple smartphone"
        stock = 25
    },
    @{
        product_id = "TABLET-001"
        name = "iPad Air"
        price = 799.99
        description = "Perfect for creative work"
        stock = 15
    },
    @{
        product_id = "WATCH-001"
        name = "Apple Watch Ultra"
        price = 799.99
        description = "Advanced fitness tracker"
        stock = 20
    },
    @{
        product_id = "AIRPODS-001"
        name = "AirPods Pro"
        price = 249.99
        description = "Wireless noise-cancelling earbuds"
        stock = 50
    },
    @{
        product_id = "MONITOR-001"
        name = "ProDisplay XDR"
        price = 4999.99
        description = "Professional reference monitor"
        stock = 5
    }
)

foreach ($product in $products) {
    Write-Host "Adding: $($product.name)" -ForegroundColor Yellow
    $json = $product | ConvertTo-Json
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/product" -Body $json
    if ($response) {
        Write-Host "✓ Added" -ForegroundColor Green
    }
    Write-Host ""
}

# Step 2: List Products
Write-Host "[Step 2] Listing All Products" -ForegroundColor Blue
Write-Host ""
$response = Invoke-ApiCall -Method "GET" -Endpoint "/product"
Write-Host ($response | ConvertTo-Json -Depth 10)
Write-Host ""

# Step 3: Add Items to Cart
Write-Host "[Step 3] Adding Items to Cart" -ForegroundColor Blue
Write-Host ""

$cartItems = @(
    @{ user_id = $USER_ID; product_id = "LAPTOP-001"; quantity = 1 },
    @{ user_id = $USER_ID; product_id = "PHONE-001"; quantity = 2 },
    @{ user_id = $USER_ID; product_id = "AIRPODS-001"; quantity = 1 }
)

foreach ($item in $cartItems) {
    Write-Host "Adding to cart: $($item.product_id) (Qty: $($item.quantity))" -ForegroundColor Yellow
    $json = $item | ConvertTo-Json
    $response = Invoke-ApiCall -Method "POST" -Endpoint "/cart" -Body $json
    Write-Host "✓ Added to cart" -ForegroundColor Green
    Write-Host ""
}

# Step 4: View Cart
Write-Host "[Step 4] Viewing Cart" -ForegroundColor Blue
Write-Host ""
$response = Invoke-ApiCall -Method "GET" -Endpoint "/cart/$USER_ID"
Write-Host ($response | ConvertTo-Json -Depth 10)
Write-Host ""

# Step 5: Update Cart Item Quantity
Write-Host "[Step 5] Updating Item Quantity" -ForegroundColor Blue
Write-Host ""
Write-Host "Updating LAPTOP-001 quantity to 2" -ForegroundColor Yellow
$updateData = @{ quantity = 2 } | ConvertTo-Json
$response = Invoke-ApiCall -Method "PUT" -Endpoint "/cart/$USER_ID/LAPTOP-001" -Body $updateData
Write-Host "✓ Updated" -ForegroundColor Green
Write-Host ""

# Step 6: Place Order
Write-Host "[Step 6] Placing Order" -ForegroundColor Blue
Write-Host ""
$orderData = @{
    user_id = $USER_ID
    shipping_address = "123 Tech Street, Singapore 234567"
    email = "customer@example.com"
    payment_method = "CARD"
} | ConvertTo-Json

Write-Host "Creating order..." -ForegroundColor Yellow
$response = Invoke-ApiCall -Method "POST" -Endpoint "/order" -Body $orderData
$orderId = $response.data.order_id
Write-Host ($response | ConvertTo-Json -Depth 10)
Write-Host ""

# Step 7: View Order Details
if ($orderId) {
    Write-Host "[Step 7] Viewing Order Details" -ForegroundColor Blue
    Write-Host "Order ID: $orderId" -ForegroundColor Yellow
    $response = Invoke-ApiCall -Method "GET" -Endpoint "/order/$orderId"
    Write-Host ($response | ConvertTo-Json -Depth 10)
    Write-Host ""
}

# Step 8: View User Orders
Write-Host "[Step 8] Viewing All User Orders" -ForegroundColor Blue
Write-Host ""
$response = Invoke-ApiCall -Method "GET" -Endpoint "/order/user/$USER_ID"
Write-Host ($response | ConvertTo-Json -Depth 10)
Write-Host ""

# Step 9: Add More Items (Cart should be empty after order)
Write-Host "[Step 9] Adding New Items to New Cart" -ForegroundColor Blue
$newItem = @{
    user_id = $USER_ID
    product_id = "TABLET-001"
    quantity = 1
} | ConvertTo-Json
$response = Invoke-ApiCall -Method "POST" -Endpoint "/cart" -Body $newItem
Write-Host "✓ Added tablet to cart" -ForegroundColor Green
Write-Host ""

# Step 10: View Final Cart
Write-Host "[Step 10] Viewing Final Cart" -ForegroundColor Blue
$response = Invoke-ApiCall -Method "GET" -Endpoint "/cart/$USER_ID"
Write-Host ($response | ConvertTo-Json -Depth 10)
Write-Host ""

Write-Host "================================" -ForegroundColor Green
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://harish-tf-frontend-726101441380.s3-website-ap-southeast-1.amazonaws.com"
Write-Host "You can now use the web interface to manage products!" -ForegroundColor Green
