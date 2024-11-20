import os
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# Function to fetch product based on keyword from Amazon
def fetch_exact_product(keyword):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0 Safari/537.36"
    }

    url = f"https://www.amazon.in/s?k={keyword}"  # Amazon search URL with keyword
    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return {"error": "Failed to fetch products from Amazon"}

    soup = BeautifulSoup(response.text, 'html.parser')
    products = []

    # Extract product names and prices
    for product in soup.select('.s-result-item'):
        title = product.select_one('h2 a span')
        price = product.select_one('.a-price .a-offscreen')

        if title and price:
            try:
                # Convert price to float for accurate comparisons
                price_value = float(price.text.replace(',', '').replace('₹', '').strip())
                product_name = title.text.strip()

                # Check if the product name matches the keyword exactly
                if keyword.lower() in product_name.lower():  # Case insensitive match
                    products.append({"name": product_name, "price": price_value})
            except ValueError:
                continue

    if not products:
        return {"error": "No products found"}

    # Find the product with the lowest price
    lowest_price_product = min(products, key=lambda x: x["price"])

    # Insert the product into MongoDB
    insert_into_mongodb(lowest_price_product)

    # Write the product to a text file
    write_to_text_file(lowest_price_product)

    return lowest_price_product

# Function to insert product into MongoDB
def insert_into_mongodb(product):
    try:
        # Connect to MongoDB (ensure MongoDB is running on localhost or set your URI)
        client = MongoClient("mongodb://localhost:27017/")
        db = client["price_scout"]  # Database name
        collection = db["products"]  # Collection name

        # Check if product already exists in the collection
        existing_product = collection.find_one({"name": product["name"]})

        current_time = datetime.utcnow()  # Use UTC time to store in MongoDB

        if existing_product:
            # If the product exists, update it only if the new price is lower
            if existing_product["price"] > product["price"]:
                collection.update_one({"name": product["name"]}, {
                    "$set": {
                        "price": product["price"],
                        "lastModified": current_time
                    }
                })
                print(f"Updated the price of {product['name']} to ₹{product['price']}")
        else:
            # If the product doesn't exist, insert a new document with lastModified timestamp
            product["lastModified"] = current_time  # Add lastModified field
            collection.insert_one(product)
            print(f"Inserted {product['name']} with price ₹{product['price']} into MongoDB")

    except Exception as e:
        print(f"Error inserting into MongoDB: {e}")


def write_to_text_file(product, filename="product_info.txt"):
    try:
        # Print debug information to make sure the data is correct
        print(f"Writing to text file: Product Name: {product['name']}, Price: {product['price']}")

        # Open the text file in write mode with utf-8 encoding
        with open(filename, "w", encoding="utf-8") as file:
            # Ensure the price is formatted as a string with the ₹ symbol
            formatted_price = f"₹{product['price']:.2f}" if isinstance(product['price'], (int, float)) else product['price']
            file.write(f"Product Name: {product['name']}\n")
            file.write(f"Price: {formatted_price}\n")
            file.write(f"Last Modified: {datetime.utcnow()}\n")
        print(f"Product details saved to {filename}")
    except Exception as e:
        print(f"Error writing to text file: {e}")

# Function to get keyword from a text file
def get_keyword_from_file(filename="keyword.txt"):
    # Check if the file exists
    if not os.path.exists(filename):
        # Create the file if it doesn't exist
        with open(filename, "w") as file:
            file.write("")  # Create an empty file
        print(f"File '{filename}' created. Please add a keyword to it.")
        return None

    # Read the keyword from the file
    with open(filename, "r") as file:
        keyword = file.readline().strip()

    if not keyword:
        print(f"No keyword found in '{filename}'. Please add a keyword.")
        return None

    return keyword

# Main function to execute the program
if __name__ == "__main__":
    keyword = get_keyword_from_file()

    if keyword:
        result = fetch_exact_product(keyword)

        if "error" in result:
            print(result["error"])
        else:
            print(f"Lowest price for '{keyword}':")
            print(f"Product Name: {result['name']}")
            print(f"Price: ₹{result['price']}")
