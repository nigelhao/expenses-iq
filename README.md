# Expense-IQ

ExpenseIQ is a specialised Spending-Tracker-as-a-Service (STaaS) powered by artificial intelligence, designed to streamline the process of recording expenditures. This innovative service simplifies expense tracking by allowing users to describe their purchases in full simple sentences. Upon receiving this information, ExpenseIQ promptly categorises each expense, generates a summary description, and accurately records the amount spent. It also features an automatic currency conversion to Singapore Dollars (SGD) using real-time exchange rates.

Unlike traditional expense trackers, which require manual input of each transaction's details—a process often tedious and prone to inaccuracies—ExpenseIQ automates these steps, significantly improving the accuracy and efficiency of personal finance management. This automation is particularly advantageous as it avoids the common pitfalls of manual entry that deter sustained user engagement.

Furthermore, distinct from other applications, ExpenseIQ focuses exclusively on monitoring outflows without tracking income. This unique approach helps users maintain a realistic perspective on their spending levels, by not offsetting expenses with income, which can often lead to underestimating one's spending.
ExpenseIQ not only logs each transaction but also analyses spending patterns to provide users with insightful statistics. These statistics aim to illuminate the total expenditure over time and motivate users towards more mindful spending habits, ultimately helping them to reduce unnecessary expenses.

To enhance user accessibility, ExpenseIQ has been meticulously developed with responsive web design, ensuring a seamless and user-friendly experience across all devices, particularly mobile. Additionally, the application is crafted as a Progressive Web App (PWA), allowing mobile users the convenience of accessing ExpenseIQ directly through an app icon, bypassing the need for a web browser. This approach not only streamlines user interaction but also significantly improves accessibility and engagement.

## Application Flow

When a user submits a request to the ExpenseIQ API, the request is forwarded to OpenAI's GPT-3.5 Turbo to extract relevant information and format it into a specified JSON structure. If the request involves any foreign currency, a call is made to the ExchangeRate API to convert the currency into Singapore Dollars (SGD). These processed values are then stored in DynamoDB for future reference.\

To optimise computational costs, all calculations and data processing occur on the user’s client device rather than on our cloud infrastructure. The primary role of our AWS Lambda function is to ensure correctness and reliable data storage and retrieval from DynamoDB. This architecture not only enhances performance but also ensures user data is processed locally, maximising privacy and efficiency.
