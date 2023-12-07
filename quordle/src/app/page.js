"use client";

import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, TextField, Box } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dictionary from "./dictionary";
const Home = () => {
  const WORD = "ABCDE"; // Word to be guessed
  const gridSize = 5; // 5 letters in a word
  const guessesAllowed = 6; // 6 attempts
  const [guesses, setGuesses] = useState(
    Array.from({ length: guessesAllowed }, () => Array(gridSize).fill(""))
  );
  const inputRefs = useRef(
    guesses.map(() =>
      Array(gridSize)
        .fill(0)
        .map(() => React.createRef())
    )
  );

  const handleInputChange = (row, col, value) => {
    // Update the guesses state with the new value, ensuring only the first character is used
    if (/^[a-zA-Z]$/.test(value.key)) {
      value.target.value = value.key;
      const newGuesses = guesses.map((currentRow, rowIndex) =>
        rowIndex === row
          ? currentRow.map((cell, cellIndex) =>
              cellIndex === col
                ? value.target.value.slice(0, 1).toUpperCase()
                : cell
            )
          : currentRow
      );
      setGuesses(newGuesses);
    } else if (
      (value.key === "Backspace" || value.key === "Delete") &&
      value.target.value.length === 1
    ) {
      value.target.value = "";
      const newGuesses = guesses.map((currentRow, rowIndex) =>
        rowIndex === row
          ? currentRow.map((cell, cellIndex) =>
              cellIndex === col ? value.target.value : cell
            )
          : currentRow
      );
      setGuesses(newGuesses);
      return;
    } else if (value.key === "Enter") {
      let word = guesses[row].join("");
      console.log(value.target);
      // if word is already guessed
      for (let i = row - 1; i >= 0; i--) {
        let prevWord = guesses[i].join("");
        if (word === prevWord) {
          toast.error("Already Tried!");
          return;
        }
      }

      // check if word is complete
      if (word.length === 5) {
        if (!dictionary.includes(word.toUpperCase())) {
          //  if word is not in the dictionary
          toast.error("Not in Word List!");
        } else {
          // when word is valid and new
          if (word === WORD) {
            toast.success("You Guessed It!");
            for (let x = row; x < guessesAllowed; x++) {
              for (let y = 0; y < gridSize; y++) {
                setTimeout(() => {
                  inputRefs.current[x][y].current.querySelector(
                    "input"
                  ).disabled = true;
                }, 0);
              }
            }
          } else {
            if (row === guessesAllowed - 1) {
              toast.error("Game Over!");
              setTimeout(
                () =>
                  inputRefs.current[row][col].current
                    .querySelector("input")
                    .blur(),
                0
              );
            } else {
              setTimeout(
                () =>
                  inputRefs.current[row + 1][0].current
                    .querySelector("input")
                    .focus(),
                0
              );
            }
            setTimeout(() => {
              inputRefs.current[row].map(
                (e) => (e.current.querySelector("input").disabled = true)
              );
            }, 0);
          }
        }
      } else {
        toast.error("Word Not Complete!");
      }
      return;
    } else if (value.key === "Tab") {
      value.preventDefault();
      console.log("tab");
      let isFocused = false;
      for (let x = 0; x < guessesAllowed; x++) {
        for (let y = 0; y < gridSize; y++) {
          if (
            inputRefs.current[x][y].current.querySelector("input").disabled ===
            false
          ) {
            inputRefs.current[x][y].current.querySelector("input").focus();
            isFocused = true;
            break;
          }
        }
        if (isFocused) {
          break;
        }
      }
    }
    // Check to move focus to the next cell
    if (value.target.value.length === 1 && col < gridSize - 1) {
      setTimeout(
        () =>
          inputRefs.current[row][col + 1].current
            .querySelector("input")
            .focus(),
        0
      );
    } else if (value.target.value.length === 0 && col > 0) {
      setTimeout(
        () =>
          inputRefs.current[row][col - 1].current
            .querySelector("input")
            .focus(),
        0
      );
    }
  };

  useEffect(() => {
    // Focus the first input on initial render
    if (inputRefs.current[0][0].current) {
      inputRefs.current[0][0].current.querySelector("input").focus();
    }
  }, []);

  return (
    <Container
      maxWidth="xs"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 4,
      }}
    >
      <Typography
        variant="h3"
        gutterBottom
        color="white"
        sx={{ textAlign: "center", fontWeight: "bold", marginBottom: 4 }}
      >
        Wordle
      </Typography>
      {guesses.map((guessRow, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "15px",
          }}
        >
          {guessRow.map((cell, colIndex) => (
            <TextField
              key={`${rowIndex}-${colIndex}`}
              ref={inputRefs.current[rowIndex][colIndex]}
              value={cell}
              onKeyDown={(e) => handleInputChange(rowIndex, colIndex, e)}
              onMouseDown={(e) => e.preventDefault()}
              inputProps={{
                maxLength: 1,
                style: {
                  color: "white",
                  fontSize: "1.5rem",
                  padding: "10px",
                  textAlign: "center",
                  caretColor: "transparent",
                },
                autoComplete: "off",
              }}
              sx={{
                width: "3rem",
                height: "3rem",
                margin: "0 4px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "white",
                  },
                  "&:hover fieldset": {
                    borderColor: "white",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "blue",
                  },
                },
              }}
              variant="outlined"
              margin="none"
            />
          ))}
        </Box>
      ))}
      <Toaster />
    </Container>
  );
};

export default Home;
