"use client";

import React, { useState, useRef, useEffect } from "react";
import { Container, Typography, TextField, Box } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dictionary from "./dictionary";
const Home = () => {
  const WORDS = ["ABCDE", "FGHIJ", "KLMNO", "PQRST"];
  const wordCount = WORDS.length;
  const hasGuessed = useRef(Array(wordCount).fill(false));
  const gridSize = 5;
  const guessesAllowed = 6;

  const [guesses, setGuesses] = useState(
    Array.from({ length: guessesAllowed }, () => Array(gridSize).fill(""))
  );

  const inputRefs = useRef(
    guesses.map(() =>
      Array(wordCount)
        .fill(0)
        .map(() =>
          Array(gridSize)
            .fill(0)
            .map(() => React.createRef())
        )
    )
  );

  const isRowComplete = (row) => {
    return guesses[row].every((cell) => cell !== "");
  };

  const getLetterColor = (rowIndex, wordIndex, cell, colIndex) => {
    // Only color if the word is complete and in the dictionary
    const word = guesses[rowIndex].join("");
    if (
      isRowComplete(rowIndex) &&
      dictionary.includes(word.toUpperCase()) &&
      inputRefs.current[rowIndex][0][gridSize - 1].current.querySelector(
        "input"
      ).disabled
    ) {
      const isCorrectLetter = WORDS[wordIndex].includes(cell);
      const isCorrectPosition = WORDS[wordIndex][colIndex] === cell;
      if (isCorrectPosition) {
        return "#4caf50"; // Green for correct position
      } else if (isCorrectLetter) {
        return "#ff9800"; // Orange for correct letter but wrong position
      }
    }
    return "transparent"; // Default background
  };

  // Game status
  const gameStatus = useRef("not started"); // ["not started","playing", "won", "lost"]\

  // implementing timer
  const [timer, setTimer] = useState(0);
  const timerRequestRef = useRef(null);
  const startTime = useRef(null);
  const startTimer = () => {
    gameStatus.current = "playing";
    const updateTimer = (timestamp) => {
      if (startTime.current === null) {
        startTime.current = timestamp;
      }
      if (!hasGuessed.current.includes(false)||gameStatus.current==="lost") {
        console.log("yo")
        return;
      }
      console.log("here");
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

  const handleInputChange = (row, wordIndex, col, value) => {
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
      // let allWordsComplete = true;

      // // Check if all words are complete
      // for (let i = 0; i < wordCount; i++) {
      //   if (!isRowComplete(row, i)) {
      //     allWordsComplete = false;
      //     break;
      //   }
      // }
      let word = guesses[row].join("");
      if (isRowComplete(row)) {
        for (let i = row - 1; i >= 0; i--) {
          let prevWord = guesses[i].join("");
          if (word === prevWord) {
            toast.error("Already Tried!");
            return;
          }
        }
        console.log(word);
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
          let currWordIndex = WORDS.findIndex((e) => e === word);
          console.log(currWordIndex);
          if (currWordIndex >= 0) {
            let copyHasGuessed = hasGuessed.current;
            copyHasGuessed[currWordIndex] = true;
            console.log(copyHasGuessed);
            hasGuessed.current = copyHasGuessed;
          }
          // When word is valid and new
          console.log(!hasGuessed.current.includes(false));
          if (!hasGuessed.current.includes(false)) {
            toast.success("You Won!");
            stopTimer();
            gameStatus.current="won";
            inputRefs.current.forEach((row) =>
              row.forEach((ref) =>
                ref.forEach(
                  (e) => (e.current.querySelector("input").disabled = true)
                )
              )
            );
            //Disable further input after guessing correctly
            // for (let x = row; x < guessesAllowed; x++) {
            //   for (let y = 0; y < gridSize; y++) {
            //     inputRefs.current[x][y].current.querySelector(
            //       "input"
            //     ).disabled = true;
            //   }
            // }
          } else {
            // Handle end of game or moving to the next row
            if (row === guessesAllowed - 1) {
              toast.error("Game Over!");
              stopTimer();
              gameStatus.current="lost";
            } else {
              inputRefs.current[row + 1][wordIndex][0].current
                .querySelector("input")
                .focus();
            }
          }
          // Disable the current row
          inputRefs.current[row].forEach((ref) =>
            ref.forEach(
              (e) => (e.current.querySelector("input").disabled = true)
            )
          );
          setGuesses([...guesses]); // Update the state to trigger re-render
        }
      } else {
        toast.error("Words Not Complete!");
      }
    }
    if (value.target.value.length === 1 && col < gridSize - 1) {
      inputRefs.current[row][wordIndex][col + 1].current
        .querySelector("input")
        .focus();
    } else if (value.target.value.length === 0 && col > 0) {
      inputRefs.current[row][wordIndex][col - 1].current
        .querySelector("input")
        .focus();
    }
  };

  useEffect(() => {
    // Focus the first input on initial render
    if (inputRefs.current[0][0][0].current) {
      inputRefs.current[0][0][0].current.querySelector("input").focus();
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
        Quordle
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
          {Array(wordCount)
            .fill(guessRow)
            .map((word, wordIndex) =>
              word.map((cell, colIndex) => {
                const letterColor = getLetterColor(
                  rowIndex,
                  wordIndex,
                  cell,
                  colIndex
                );
                return (
                  <TextField
                    key={`${rowIndex}-${wordIndex}-${colIndex}`}
                    ref={inputRefs.current[rowIndex][wordIndex][colIndex]}
                    value={cell}
                    onKeyDown={(e) =>
                      handleInputChange(rowIndex, wordIndex, colIndex, e)
                    }
                    onMouseDown={(e) => {
                      if (
                        rowIndex > 0 &&
                        !inputRefs.current[
                          rowIndex - 1
                        ][0][0].current.querySelector("input").disabled
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
                            letterColor !== "transparent"
                              ? letterColor
                              : "white",
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
              })
            )}
        </Box>
      ))}
      <Toaster />
      <Typography variant="h4">Timer: {formatTime(timer)} </Typography>
    </Container>
  );
};

export default Home;
