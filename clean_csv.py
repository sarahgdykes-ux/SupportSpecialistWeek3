import csv
import re

def clean_description(text):
    """Clean up the ticket description field"""
    if not text or text == '':
        return ''
    
    # Replace {product_purchased} placeholder with actual product name
    # This will be handled separately with the actual product name
    
    # Remove template/garbage text patterns
    patterns_to_remove = [
        r"I'm having an issue with the \{product_purchased\}\. Please assist\.",
        r"I'm facing a problem with my \{product_purchased\}\.",
        r"Your billing zip code is: \d{5}\.",
        r"We appreciate that you have requested a website address\.",
        r"Please double check your email address\.",
        r"If you need to change an existing product\.",
        r"If The issue I'm facing is intermittent\. Sometimes it works fine, but other times it acts up unexpectedly\.",
        r"Note: The seller is not responsible for any damages arising out of the delivery of the battleground game\. Please have the game in good condition and shipped to you",
        r"To remove the new \{product_purch",
        r"Solution \d+ I'm unable to find the option to perform the desired action in the \{product_purchased\}\. Could you please guide me through the steps\?",
        r"\(Thanks\) I will contact all my suppliers and confirm\.",
        r"Please try and find out whether their inventory is currently stocked, or any other reason\. I am",
        r"\{product_purchased\} is not the exact type you might prefer, they use the exact same method for different uses\. Please help",
        r"Product Search: What's New in 2-3-4-5\? Report Feedback Customer Service is your best",
        r"It is possible that we cannot find some type of text or a product name to identify someone like Mr\. Brown\.",
        r"On the I've reviewed the troubleshooting steps on the official support website, but they didn't resolve the problem\.",
        r"CQW: Why didn't I send him the invoice\? Thanks a lot\.",
        r"L: He's like the best customer I've met\.",
        r"I can't find the 'Product_IP' field of the",
        r"Product Name: [A-Z0-9]+",
        r"Join Date: \w+ \d+ Posts: [\d,]+",
        r"Quote: I've recently updated the firmware of my \{product_purchased\}, and the issue started happening afterward\. Could it be related to the update\?",
        r"Please note, you might have already paid for this product, which means spectators are not buying any of the products from the sale as their donations will go straight",
        r"- Acknowledgement: Thanks to Dan for the tip\. When you purchase a new product from my store or from your local retailer, they will also provide",
        r"\* \[0\] - \[0\] - \[0\] - \[0\]",
        r"If this product is sold and you have not used any",
        r"I'm having an issue with the product_purchased\}\. Please assist\. Customer Reviewer: My Husband was able to take an order from Apple",
        r'"" -name ""Microsoft Surface Pro\. ""',
        r'"" -version [\d\.]+ ""[\d\.]+""',
        r'"" -usage',
        r"The email address should change to: [\w@\.]+, as there is a unique id number unique for each product\.",
        r"You I've tried different settings and configurations on my \{product_purchased\}, but the issue persists\.",
        r"\(And if need be this time, that could help\.\)",
        r"Update my version to [\d\.]+ or more\.",
        r"I'll take care of those\.",
        r"\{product_purchased\} does not represent the price which you received by the day immediately before the shipment date\.",
        r"In many cases, this is the",
        r"} If we can, please send a ""request"" to dav",
        r"1-800-799-0808\.",
    ]
    
    cleaned = text
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    # Clean up extra whitespace and newlines
    cleaned = re.sub(r'\n+', ' ', cleaned)  # Replace newlines with space
    cleaned = re.sub(r'\s+', ' ', cleaned)  # Replace multiple spaces with single space
    cleaned = cleaned.strip()
    
    return cleaned

def clean_resolution(text):
    """Clean up the resolution field"""
    if not text or text == '':
        return ''
    
    # Remove nonsensical/garbled resolutions
    garbled_patterns = [
        r"Case maybe show recently my computer follow\.",
        r"Try capital clearly never color toward story\.",
        r"West decision evidence bit\.",
        r"Measure tonight surface feel forward\.",
        r"Measure there house management pick knowledge trade\.",
        r"Officer moment world sing parent available\.",
        r"Seek evidence book collection catch\.",
        r"Wish mouth build resource though\.",
    ]
    
    cleaned = text
    for pattern in garbled_patterns:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
    
    cleaned = cleaned.strip()
    
    # If the cleaned resolution is just whitespace or very short, return empty
    if len(cleaned) < 10:
        return ''
    
    return cleaned

def main():
    input_file = r'c:\Users\sarah\Documents\SupportSpecialistWeek3\customer_support_tickets.csv'
    output_file = r'c:\Users\sarah\Documents\SupportSpecialistWeek3\customer_support_tickets_cleaned.csv'
    
    # Read CSV with proper handling of quoted fields
    with open(input_file, 'r', encoding='utf-8', newline='') as infile:
        reader = csv.DictReader(infile)
        headers = reader.fieldnames
        
        cleaned_rows = []
        for row in reader:
            # Get the actual product name
            product = row.get('Product Purchased', '').strip()
            
            # Clean description and replace {product_purchased} with actual product
            desc = row.get('Ticket Description', '')
            desc_cleaned = clean_description(desc)
            desc_cleaned = desc_cleaned.replace('{product_purchased}', product)
            row['Ticket Description'] = desc_cleaned
            
            # Clean resolution
            resolution = row.get('Resolution', '')
            row['Resolution'] = clean_resolution(resolution)
            
            # Trim whitespace from all fields
            for key in row:
                if row[key]:
                    row[key] = str(row[key]).strip()
            
            cleaned_rows.append(row)
    
    # Write cleaned CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=headers, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        writer.writerows(cleaned_rows)
    
    print(f"Original rows processed: {len(cleaned_rows)}")
    print(f"Columns: {headers}")
    print(f"Cleaned CSV saved to: {output_file}")
    
    # Show sample of cleaned data
    print("\nSample of cleaned data (first 3 rows):")
    for i, row in enumerate(cleaned_rows[:3]):
        print(f"\nRow {i+1}:")
        for key, value in row.items():
            print(f"  {key}: {value}")

if __name__ == '__main__':
    main()
