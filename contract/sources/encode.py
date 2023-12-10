def encode(word):
    encoded = 0
    for char in word:
        encoded *= 26
        encoded += ord(char) - ord('A')
    return encoded


# wordlist from https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt
with open('words.txt', 'r') as f:
    for line in f:
        word = line.strip()
        encoded = encode(word)
        # piped to a file and copied into common.move
        print(f"        {encoded}, // {word}")
