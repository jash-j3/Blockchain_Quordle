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

  const isRowComplete = (row) => {
    return guesses[row].every((cell) => cell !== "");
  };

  const getLetterColor = (rowIndex, cell, colIndex) => {
    // Only color if the word is complete and in the dictionary
    let word = guesses[rowIndex].join("");
    if (
      isRowComplete(rowIndex) &&
      dictionary.includes(word.toUpperCase()) &&
      inputRefs.current[rowIndex][gridSize - 1].current.querySelector("input")
        .disabled
    ) {
      const isCorrectLetter = WORD.includes(cell);
      const isCorrectPosition = WORD[colIndex] === cell;

      if (isCorrectPosition) {
        return "#4caf50"; // Green for correct position
      } else if (isCorrectLetter) {
        return "#ff9800"; // Orange for correct letter but wrong position
      }
    }
    return "transparent"; // Default background
  };

  // Game status
  const [gameStatus, setGameStatus] = useState("not started"); // ["not started","playing", "won", "lost"]
  
  // implementing timer
  const [timer, setTimer] = useState(0);
  const timerRequestRef = useRef(null);
  const startTime = useRef(null);
  const startTimer = () => {
    startTime.current = performance.now();
    setGameStatus("playing");
    const updateTimer = (timestamp) => {
      const elapsed = timestamp - startTime.current;
      setTimer(elapsed);
      timerRequestRef.current = requestAnimationFrame(updateTimer);
    };

    timerRequestRef.current = requestAnimationFrame(updateTimer);
  };

  const stopTimer = () => {
    cancelAnimationFrame(timerRequestRef.current);
  };

  const resetTimer = () => {
    cancelAnimationFrame(timerRequestRef.current);
    setTimer(0);
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const remainingMilliseconds = Math.floor(milliseconds % 1000);
    return `${seconds}:${
      remainingMilliseconds < 100 ? "0" : ""
    }${remainingMilliseconds}`;
  };

  const handleInputChange = (row, col, value) => {
    if (/^[a-zA-Z]$/.test(value.key)) {
      if (timer === 0) {
        startTimer();
      }
      value.target.value = value.key.toUpperCase();
      const newGuesses = guesses.map((currentRow, rowIndex) =>
        rowIndex === row
          ? currentRow.map((cell, cellIndex) =>
              cellIndex === col ? value.target.value.slice(0, 1) : cell
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
      if (isRowComplete(row)) {
        // Check if word is already guessed
        for (let i = row - 1; i >= 0; i--) {
          let prevWord = guesses[i].join("");
          if (word === prevWord) {
            toast.error("Already Tried!");
            return;
          }
        }

        if (!dictionary.includes(word.toUpperCase())) {
          // If word is not in the dictionary
          toast.error("Not in Word List!");
        } else {
          // Word is valid, color the letters
          setGuesses((currentGuesses) => {
            const newGuesses = [...currentGuesses];
            // Trigger a re-render to color the letters
            return newGuesses;
          });

          // When word is valid and new
          if (word === WORD) {
            toast.success("You Guessed It!");
            stopTimer();
            setGameStatus("won");
            inputRefs.current[row].forEach(
              (ref) => (ref.current.querySelector("input").disabled = true)
            );
            //Disable further input after guessing correctly
            for (let x = row; x < guessesAllowed; x++) {
              for (let y = 0; y < gridSize; y++) {
                inputRefs.current[x][y].current.querySelector(
                  "input"
                ).disabled = true;
              }
            }
          } else {
            // Handle end of game or moving to the next row
            if (row === guessesAllowed - 1) {
              toast.error("Game Over!");
              stopTimer();
              setGameStatus("lost");
            } else {
              inputRefs.current[row + 1][0].current
                .querySelector("input")
                .focus();
            }
          }
          // Disable the current row
          inputRefs.current[row].forEach(
            (ref) => (ref.current.querySelector("input").disabled = true)
          );
          setGuesses([...guesses]); // Update the state to trigger re-render
        }
      } else {
        toast.error("Word Not Complete!");
      }
    } else if (value.key === "Tab") {
      // Handle tab navigation
      value.preventDefault();
      let isFocused = false;
      for (let x = 0; x < guessesAllowed; x++) {
        for (let y = 0; y < gridSize; y++) {
          if (
            !inputRefs.current[x][y].current.querySelector("input").disabled
          ) {
            inputRefs.current[x][y].current.querySelector("input").focus();
            isFocused = true;
            break;
          }
        }
        if (isFocused) break;
      }
    }

    // Move focus to the next or previous cell
    if (value.target.value.length === 1 && col < gridSize - 1) {
      inputRefs.current[row][col + 1].current.querySelector("input").focus();
    } else if (value.target.value.length === 0 && col > 0) {
      inputRefs.current[row][col - 1].current.querySelector("input").focus();
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
          {guessRow.map((cell, colIndex) => {
            const letterColor = getLetterColor(rowIndex, cell, colIndex);
            return (
              <TextField
                key={`${rowIndex}-${colIndex}`}
                ref={inputRefs.current[rowIndex][colIndex]}
                value={cell}
                onKeyDown={(e) => handleInputChange(rowIndex, colIndex, e)}
                onMouseDown={(e) => {
                  if (
                    rowIndex > 0 &&
                    !inputRefs.current[rowIndex - 1][0].current.querySelector(
                      "input"
                    ).disabled
                  ) {
                    e.preventDefault();
                  }
                }}
                inputProps={{
                  maxLength: 1,
                  style: {
                    color: "white",
                    fontSize: "1.5rem",
                    padding: "10px",
                    textAlign: "center",
                    caretColor: "transparent",
                    backgroundColor: letterColor,
                  },
                  autoComplete: "off",
                }}
                sx={{
                  width: "3rem",
                  height: "3rem",
                  margin: "0 4px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor:
                        letterColor !== "transparent" ? letterColor : "white",
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
            );
          })}
        </Box>
      ))}
      <Toaster />
      <Typography variant="h4">Timer: {formatTime(timer)} </Typography>
    </Container>
  );
};

export default Home;
