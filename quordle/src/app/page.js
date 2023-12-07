"use client";

import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, TextField, Box } from "@mui/material";

const Home = () => {
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
              cellIndex === col ? value.target.value.slice(0, 1).toUpperCase() : cell
            )
          : currentRow
      );
      setGuesses(newGuesses);
    }
    else if ((value.key === "Backspace" || value.key === "Delete") && value.target.value.length === 1) {
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
    }
    // Check to move focus to the next cell
    if (value.target.value.length === 1 && col < gridSize - 1) {
      setTimeout(() => inputRefs.current[row][col + 1].current.querySelector("input").focus(), 0);
    } else if (value.target.value.length === 0 && col > 0) {
      setTimeout(() => inputRefs.current[row][col - 1].current.querySelector("input").focus(), 0);
    }
  };

  useEffect(() => {
    // Focus the first input on initial render
    if (inputRefs.current[0][0].current) {
      inputRefs.current[0][0].current.focus();
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
              onKeyDown={(e) =>
                handleInputChange(rowIndex, colIndex, e)
              }
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
    </Container>
  );
};

export default Home;
