import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime


try:
    data = pd.read_csv("facial_expressions_log.csv")
    print("CSV file loaded successfully.")
    # Display the first few rows to verify loading
    print(data.head())

    # Convert the 'Timestamp' column to datetime objects
    data['Timestamp'] = pd.to_datetime(data['Timestamp'])

    # Convert the Timstamp in UTC to IST in the format YYYY-MM-DD HH:MM:SS
    data['Timestamp'] = data['Timestamp'].dt.tz_convert('Asia/Kolkata')

    # List of expression columns to plot
    expressions = ['Angry', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'Sad', 'Surprised']

    # Create the plot
    plt.figure(figsize=(14, 7)) # Adjusted figure size for better readability

    # Define colors for each expression for clarity
    colors = {
        'Angry': 'red',
        'Disgusted': 'green',
        'Fearful': 'purple',
        'Happy': 'gold', # Changed from yellow for better visibility on white background
        'Neutral': 'blue',
        'Sad': 'cyan',
        'Surprised': 'orange'
    }

    # Plot each expression on the same graph
    for expression in expressions:
        if expression in data.columns:
            plt.plot(data['Timestamp'], data[expression], label=expression, color=colors[expression])
        else:
            print(f"Warning: Column '{expression}' not found in the CSV file.")

    # Add labels, title, legend, and grid
    plt.xlabel('Meet Time (IST)')
    plt.ylabel('Expression Intensity (%)')
    plt.title('Facial Expression Detection Over Time')
    plt.ylim(0, 100) # Set y-axis limits from 0 to 100
    plt.legend()
    plt.grid(True)

    # Show the plot
    plt.savefig('images/facial_expressions_plot.png')
    plt.show()
    # Save the plot as an image file
    print("Plot saved as 'facial_expressions_plot.png'.")
    print("Plot generated successfully.")

except FileNotFoundError:
    print("Error: The file 'facial_expressions_log-2.csv' was not found.")
except Exception as e:
    print(f"An error occurred: {e}")

