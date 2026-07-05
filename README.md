# Roommate Behavioral Intelligence & Compatibility System

## Project Overview

Finding the right roommate is often based on guesswork, leading to conflicts arising from differences in lifestyle, sleep schedules, cleanliness habits, privacy preferences, and social behavior. This project aims to address that problem using machine learning and behavioral analytics.

The system analyzes behavioral and lifestyle characteristics of students, identifies hidden behavioral patterns, and predicts roommate compatibility using clustering techniques and supervised machine learning models. Beyond generating compatibility scores, the project also provides insights into the factors that most strongly influence successful roommate pairings.

---

## Dataset

Since no suitable public dataset existed for this problem, a custom behavioral dataset was designed and generated for experimentation.

### Dataset Statistics

* 500 synthetic student profiles
* 10,000 roommate pair combinations
* 60+ behavioral and lifestyle attributes
* 207 engineered features after feature engineering

### Feature Categories

* Sleep & Routine Habits
* Study Preferences
* Cleanliness & Organization
* Privacy Preferences
* Social Behavior
* Lifestyle Characteristics
* Environmental Preferences
* Personality Traits

---

## Project Pipeline

### 1. Behavioral Dataset Generation

Created realistic student profiles with diverse lifestyle and personality characteristics.

### 2. Compatibility Engine

Developed a weighted compatibility scoring framework that evaluates similarity across critical behavioral dimensions such as sleep habits, cleanliness, social preferences, privacy expectations, and environmental tolerance.

### 3. Exploratory Data Analysis (EDA)

Performed extensive exploratory analysis to understand behavioral distributions and compatibility patterns.

Techniques used:

* Correlation Analysis
* Distribution Analysis
* Behavioral Trend Exploration

### 4. Clustering Analysis

Applied unsupervised learning techniques to discover hidden behavioral archetypes.

Algorithms:

* K-Means Clustering
* DBSCAN Clustering

Evaluation:

* Silhouette Score Analysis
* Cluster Comparison

### 5. Dimensionality Reduction & Visualization

Visualized high-dimensional behavioral data using:

* PCA (Principal Component Analysis)
* t-SNE (t-Distributed Stochastic Neighbor Embedding)

These visualizations helped identify behavioral groupings and cluster separations.

### 6. Advanced Feature Engineering

Engineered compatibility-focused features including:

* Behavioral Alignment Score
* Sleep Compatibility
* Social Compatibility
* Privacy Compatibility
* Cleanliness Compatibility
* Difference Features
* Similarity Features
* Lifestyle Matching Features

This expanded the dataset to 207 predictive features.

### 7. Machine Learning Models

#### Random Forest Classifier

Used as the baseline model.

Results:

* Accuracy: 77.85%
* Weighted F1 Score: 0.776

#### XGBoost Classifier

Used for advanced model optimization.

Results:

* Accuracy: 84.60%
* Weighted F1 Score: 0.847

XGBoost significantly outperformed the Random Forest baseline and became the final selected model.

---

## Key Insights

Feature importance analysis revealed that roommate compatibility is driven primarily by behavioral factors rather than demographic attributes.

Top predictors included:

* Behavioral Alignment Score
* Lifestyle Similarity
* Social Compatibility
* Sleep Schedule Similarity
* Noise Tolerance Alignment
* Cleanliness Compatibility
* Privacy Preference Alignment

The analysis showed that students with similar behavioral patterns tend to have significantly higher compatibility, while differences in sleep schedules, cleanliness habits, and environmental preferences often lead to incompatibility.

---

## Technologies Used

* Python
* Pandas
* NumPy
* Scikit-Learn
* XGBoost
* Matplotlib
* Seaborn
* Jupyter Notebook

---

## Future Improvements

* LLM-powered compatibility explanations
* Explainable AI using SHAP
* Real-time roommate recommendation engine
* Personalized roommate matching dashboard
* Conflict prediction and early intervention system
* Deployment as a full-stack recommendation platform

---

## Conclusion

This project demonstrates how behavioral analytics, machine learning, and feature engineering can be combined to build an intelligent roommate recommendation system. By leveraging clustering, advanced feature engineering, and XGBoost-based classification, the system achieves strong predictive performance while providing actionable insights into the behavioral factors that drive successful roommate relationships.

<!---LeetCode Topics Start-->
# LeetCode Topics
## Linked List
|  |
| ------- |
| [0237-delete-node-in-a-linked-list](https://github.com/aarushiiii28/Smart-Resident-Matching-System/tree/master/0237-delete-node-in-a-linked-list) |
## Hash Table
|  |
| ------- |
| [1781-sum-of-beauty-of-all-substrings](https://github.com/aarushiiii28/Smart-Resident-Matching-System/tree/master/1781-sum-of-beauty-of-all-substrings) |
## String
|  |
| ------- |
| [1781-sum-of-beauty-of-all-substrings](https://github.com/aarushiiii28/Smart-Resident-Matching-System/tree/master/1781-sum-of-beauty-of-all-substrings) |
## Counting
|  |
| ------- |
| [1781-sum-of-beauty-of-all-substrings](https://github.com/aarushiiii28/Smart-Resident-Matching-System/tree/master/1781-sum-of-beauty-of-all-substrings) |
<!---LeetCode Topics End-->