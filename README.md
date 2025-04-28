📄 Google Spreadsheet Clone
A lightweight web-based Spreadsheet Application built with HTML5 Canvas, JavaScript, and Math.js.
It mimics basic spreadsheet functionalities like editing cells, applying formulas (=A1+B1), inserting functions (SUM, AVERAGE, MIN, MAX), data validation, and basic file operations (Save, Load).

✨ Features
1. Canvas-based Spreadsheet Grid
2. Cell Selection and Inline Editing
3. Formula Bar to input and edit expressions
4. Mathematical Functions (SUM, AVERAGE, MIN, MAX, COUNT)
5. Data Quality Tools (TRIM, UPPER, LOWER, REMOVE_DUPLICATES, FIND_AND_REPLACE)
6. Data Validation (Numeric validation)
7. Save and Load Spreadsheet Data (via localStorage or download/upload mechanism)
8. Generate Chart (Placeholder for future charting functionality)

📂 Project Structure

/
├── index.html   # Main HTML file
├── app.js       # JavaScript logic for spreadsheet
└── README.md    # Project documentation (this file)


⚙️ How to Run the Project Locally
This project is pure frontend — no server setup is required. You just need a web browser.
Steps:
1. Clone or Download the Repository:
    git clone https://github.com/Lakshit15/spreadsheet-clone.git
    or simply download the ZIP file and extract it.

2. Open the Project:
    Navigate to the project folder.
    Open the index.html file directly in your browser.
    (Right-click → Open With → Choose your Browser)

3. That’s it! 🥳 The Spreadsheet Clone will open and you can start using it.
    Requirements:
    Any modern web browser:
    Google Chrome (Recommended)
    Mozilla Firefox
    Microsoft Edge
    Safari

🛠️ Built With

  HTML5 — for structure
  CSS3 — for styling (Dark Theme)
  JavaScript (ES6) — for functionality
  Canvas API — for grid rendering
  Math.js — for parsing and evaluating formulas

🧑‍💻 Usage Instructions
•	Editing a Cell:
  o	Click on any cell to select it.
  o	Start typing to edit the content.
  o	Press Enter to save.
•	Using the Formula Bar:
  o	Type a formula (e.g., =A1+B1) into the formula input box and press Enter.
•	Applying Functions Quickly:
  o	Use the toolbar buttons to insert predefined functions like SUM, AVERAGE, etc.
•	Data Validation:
  o	Use the "Validate Numeric" button to ensure selected cells have numeric values only.
•	Saving Data:
  o	Click the "Save" button to store your spreadsheet data (to localStorage or download as file depending on app.js implementation).
•	Loading Data:
  o	Click "Load" to restore previously saved data.
•	Generating Chart:
  o	Click "Generate Chart" (functionality under development or placeholder).

🤝 Contributing

  Contributions are welcome!
  Feel free to open an issue or submit a pull request if you find bugs or want to add new features.

📄 License
  This project is licensed under the MIT License — feel free to use and modify it!

✉️ Contact
  GitHub: Lakshit15
  Email: lakshitjain15092003@gmail.com

🌟 Happy Spreadsheet-ing!
