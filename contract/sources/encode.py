def encode(word):
    encoded = 0
    for char in word:
        encoded *= 26
        encoded += ord(char) - ord('A')
    return encoded


with open('words.txt', 'r') as f:
    for line in f:
        word = line.strip()
        encoded = encode(word)
        # piped to a file and copied into common.move
        print(f"        {encoded}, // {word}")
