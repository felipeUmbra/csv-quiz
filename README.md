# CSV Quiz Generator

A modern, interactive web application that transforms CSV files into dynamic quizzes. Built with React, TypeScript, and Tailwind CSS, this tool allows educators, students, and professionals to easily create, take, and print quizzes directly from simple spreadsheet data.

## ✨ Features

* **Instant Quiz Generation:** Upload a formatted CSV file and instantly get a responsive, interactive quiz.
* **Topic-based Customization:** Choose exactly how many questions to pull from each specific topic before starting.
* **Intelligent Randomization:** Both the order of the questions and the order of the multiple-choice alternatives are randomized every time you start or restart the quiz.
* **Keyboard Shortcuts:** Fast-paced interaction using keys `A`-`H` for selecting options and `Enter` to navigate.
* **Rich Feedback & Analytics:** * Real-time feedback on correct/incorrect answers.
    * Final score calculation.
    * Detailed timer tracking.
    * Detailed performance breakdown categorized by topic.
* **Study Settings:** Toggle "Omit correct answer" to challenge yourself by not seeing the right answer when you fail.
* **Dark Mode Support:** Seamlessly toggle between Light and Dark themes for better readability.
* **Print & Export:** Built-in support to print the final review or save it as a cleanly formatted PDF.
* **Downloadable Template:** Users can download a base CSV template directly from the UI to understand the required formatting.

## 📊 Expected CSV Format

To ensure the quiz generator works correctly, your CSV file must contain a header row with specific column names. The application supports between 2 to 8 alternatives per question.

### Required Columns:
* `Topico`: The category or subject of the question (e.g., Math, Science).
* `pergunta`: The actual question text.
* `alternativa correta`: The letter corresponding to the correct answer (e.g., `a`, `b`, `c`).
* `alternativa a`, `alternativa b`, `alternativa c`, etc.: The text for each multiple-choice option.

### Example CSV:
```csv
Topico,pergunta,alternativa correta,alternativa a,alternativa b,alternativa c,alternativa d
Matemática,Quanto é 2 + 2?,c,3,5,4,6
Ciências,Qual é o planeta em que vivemos?,b,Marte,Terra,Júpiter,Saturno
Português,Qual é o plural de animal?,a,animais,animas,animalis,animalzinhos
Note: The system automatically shuffles the alternatives, so setting the correct alternative as 'a', 'b', or 'c' in the spreadsheet will not make it predictable for the user.
```
### 🛠️ Technologies Used
React 18 - UI Library

* TypeScript - Static typing
* Vite - Fast frontend tooling and bundler
* Tailwind CSS - Utility-first CSS framework for styling
* Framer Motion - Smooth page transitions and animations
* PapaParse - Robust CSV parsing
* Lucide React - Beautiful, consistent iconography

### 🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites
You need to have Node.js (version 16 or higher) and npm installed on your machine.

Installation
- Clone the repository:
  - Bash
  - git clone [https://github.com/your-username/csv-quiz.git](https://github.com/your-username/csv-quiz.git)
- Navigate into the project directory:
  - Bash
  - cd csv-quiz
- Install the dependencies:
  - Bash
  - npm install
- Start the development server:
  - Bash
  - npm run dev
  - Open your browser and visit http://localhost:5173 to view the application.

### 📦 Build for Production
To create a production-ready build, run:
- Bash
- npm run build
This will generate a dist folder containing the compiled and minified assets, ready to be deployed to platforms like Vercel, Netlify, or GitHub Pages.

### 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

* Fork the Project
* Create your Feature Branch (git checkout -b feature/AmazingFeature)
* Commit your Changes (git commit -m 'Add some AmazingFeature')
* Push to the Branch (git push origin feature/AmazingFeature)
* Open a Pull Request

### 📝 License
This project is open-source and available under the MIT License.