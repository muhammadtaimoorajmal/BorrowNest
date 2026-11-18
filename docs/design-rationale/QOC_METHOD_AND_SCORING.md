# BorrowNest — QOC Methodology and Scoring Model

## 1. The QOC Design Space Analysis Framework

The **Question-Option-Criteria (QOC)** framework is a recognized, semi-formal design rationale representation technique originally formulated by Allan MacLean, Richard M. Young, Victoria M. E. Bellotti, and Thomas P. Moran (1991) in their seminal work:

> MacLean, A., Young, R. M., Bellotti, V. M. E., & Moran, T. P. (1991).  
> *"Questions, Options, and Criteria: Elements of Design Space Analysis."*  
> **Human–Computer Interaction**, 6(3–4), 201–250.  
> DOI: [https://doi.org/10.1080/07370024.1991.9667168](https://doi.org/10.1080/07370024.1991.9667168)

### Core Components of QOC:
- **Questions (Q)**: Identify key design problems, architectural bottlenecks, or interaction dilemmas that delimit the design space. A good question frames the problem without presupposing a specific technical solution.
- **Options (O)**: Represent distinct, feasible design alternatives or candidate architectures that answer the Question. At least three viable options must be formulated to avoid artificial binary choices.
- **Criteria (C)**: Explicit evaluative dimensions (e.g., usability heuristics, accessibility standards, privacy constraints, cognitive load, technical feasibility) against which options are compared and judged.
- **Justification / Choice**: The systematic synthesis of positive and negative assessments leading to an evidence-backed decision that balances competing trade-offs.

---

## 2. Evaluation Scale and Rubric

To ensure analytical consistency across all six decisions, options are evaluated against each criterion using a standardized five-point qualitative and quantitative rating scale:

| Rating | Qualitative Descriptor | Operational Definition |
| :---: | :--- | :--- |
| **1** | **Poor** | Severe deficiencies; fails to satisfy fundamental requirements or introduces critical usability, security, or accessibility barriers. |
| **2** | **Weak** | Significant shortcomings; partially addresses the criterion but introduces substantial friction, high cognitive load, or notable implementation risk. |
| **3** | **Adequate** | Acceptable baseline; satisfies core needs with standard performance but offers minimal ergonomic advantages or leaves minor trade-offs unresolved. |
| **4** | **Strong** | High performance; thoroughly satisfies the criterion with well-structured ergonomics, low error rates, and clean technical alignment. |
| **5** | **Excellent** | Exemplary performance; fully satisfies the criterion with superior usability, robust error prevention, minimal cognitive burden, and strict privacy/accessibility adherence. |

---

## 3. Weighting Methodology and Scoring Formula

### Criterion Weighting Rules:
1. Every decision defines a set of 5 specific criteria tailored to the domain.
2. Each criterion $i$ is assigned a percentage weight $W_i$.
3. The sum of all criterion weights for any given decision must equal exactly 100%:
   $$\sum_{i=1}^{n} W_i = 100\%$$
4. Weights reflect the relative criticality of the criterion in the context of BorrowNest's local-first, privacy-respecting community lending model.

### Mathematical Scoring Formula:
The final **Weighted Option Score** is calculated on a normalized 0–100 scale:

$$\text{Weighted Option Score} = \sum_{i=1}^{n} \left( W_i \times \frac{R_i}{5} \right)$$

Where:
- $W_i$ is the percentage weight assigned to Criterion $i$ (e.g., 25% = 25).
- $R_i$ is the option's rating against Criterion $i$ on the 1–5 scale ($R_i \in \{1, 2, 3, 4, 5\}$).
- Division by 5 normalizes the maximum possible score to 100 points.

### Demonstration Calculation:
Suppose a criterion has a weight of $25\%$ ($W_1 = 25$), and Option C receives a rating of $4/5$ ($R_1 = 4$):
$$\text{Contribution} = 25 \times \frac{4}{5} = 20.0 \text{ points}$$

If Option C achieves ratings of $5, 5, 4, 4, 4$ across criteria with weights $25\%, 25\%, 20\%, 20\%, 10\%$:
$$\text{Score} = \left(25 \times \frac{5}{5}\right) + \left(25 \times \frac{5}{5}\right) + \left(20 \times \frac{4}{5}\right) + \left(20 \times \frac{4}{5}\right) + \left(10 \times \frac{4}{5}\right)$$
$$\text{Score} = 25.0 + 25.0 + 16.0 + 16.0 + 8.0 = 90.0 \text{ points}$$

All calculations are reported with no more than one decimal place.

---

## 4. Scoring Integrity and Non-Fabrication Standards

In accordance with strict project-wide data-integrity policies:
- **Analytical Judgments**: The ratings assigned in Module 02 are **expert analytical design assessments**. They synthesize recognized HCI literature, Nielsen's heuristics, W3C accessibility guidelines, and local-first software engineering constraints.
- **No Fictitious Empirical Data**: Ratings are **NOT** survey averages, participant telemetry scores, or usability lab statistics. No user quotes, satisfaction percentages, or participant counts have been fabricated.
- **Defensible Rationales**: Every score (whether 1 or 5) is accompanied by explicit textual justification explaining why the architectural characteristics of the option warrant that evaluation.
- **Objective Evaluation**: Options were not scored to artificially favor a predetermined outcome; trade-offs and weaknesses of the winning alternatives are documented transparently.

---

## 5. Methodological Limitations and Sensitivity Analysis

### Limitations of Multi-Attribute Weighting:
While multi-attribute weighted scoring provides structured transparency, it has recognized theoretical limitations:
- **Linear Additivity**: The model assumes criteria are independent, whereas in practice, factors like usability and accessibility often reinforce one another.
- **Weight Subjectivity**: Criterion weights reflect design priorities established at this stage of the project.

### Sensitivity Analysis Protocol:
To ensure decision stability, each decision includes a **Sensitivity Consideration**:
- When competing options yield close aggregate totals (e.g., within 10 points), the analysis tests whether reasonable shifts in criterion weighting (such as prioritizing development velocity over long-term flexibility) would alter the winning option.
- If the selected option dominates across the highest-weighted criteria, the decision is considered **robust and stable**.
