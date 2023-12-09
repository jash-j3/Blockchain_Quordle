

# open temp.txt
# read each line


result = []

with open('temp.txt', 'r') as f:
    lines = f.readlines()
    c = 0
    for line in lines:
        result.append(f"b\"{line.strip()}\", ")
        c+=1
        if c == 50:
            result.append('\n')
            c = 0

with open('temp1.txt', 'w') as f:
    f.writelines(result)