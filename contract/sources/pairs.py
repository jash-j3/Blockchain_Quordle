with open('answers.txt', 'r') as f:
    answers = []
    for line in f:
        answer = line.strip()
        answers.append(answer)

intersections = 0
pairs = []
for i in range(len(answers)):
    for j in range(i + 1, len(answers)):
        # check for intersection
        a1 = set(answers[i])
        a2 = set(answers[j])
        if len(a1 & a2) == 0:
            pairs.append((i, j))

for idx1, _ in pairs:
    print(f"        {idx1},")

print()

for _, idx2 in pairs:
    print(f"        {idx2},")
