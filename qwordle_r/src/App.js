import React, { useState, useEffect, useRef } from "react";
import Home from "./page1";
import QApp from "./App_qwordle";
import { Container, Typography, TextField, Box } from "@mui/material";
import toast, { Toaster } from "react-hot-toast";
import dictionary from "./dictionary";
import "./App.css";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InfoIcon from "@mui/icons-material/Info";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import {
  Types,
  AptosClient,
  AptosAccount,
  HexString,
  TxnBuilderTypes,
} from "aptos";
import { createTheme, ThemeProvider } from "@mui/material/styles";
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "black",
          borderColor: "white",
          color: "white",
          border: "1px solid",
          "&:hover": {
            backgroundColor: "black",
            borderColor: "white",
          },
        },
      },
    },
  },
});
const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

const App = () => {
  const [account, setAccount] = useState(null);
  const [transactionResult, setTransactionResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(["NA", "NA", "NA", Array(6).fill(0)]);
  const [GS, setGS] = useState([[], [], 0]);
  const WORD = "ABCDE"; // Word to be guessed
  const gridSize = 5; // 5 letters in a word
  const guessesAllowed = 6; // 6 attempts
  // console.log("envvv", process.env.REACT_APP_ADDRESS);
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
  useEffect(() => {
    const getAptosWallet = () => {
      if ("aptos" in window) {
        return window.aptos;
      } else {
        window.open("https://petra.app/", `_blank`);
      }
    };

    const connectWallet = async () => {
      const wallet = getAptosWallet();
      try {
        await wallet.connect();
        const acc = await wallet.account();
        setAccount(acc);
      } catch (err) {
        console.log(err);
        setError(err);
      }
    };

    if (typeof window !== "undefined") {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    const executeTransaction = async () => {
      if (!account) return;

      console.log("account:", account);
      const payload = {
        function: `${process.env.REACT_APP_ADDRESS}::wordle::get_stats`,
        type_arguments: [],
        arguments: [account.address],
      };
      try {
        const view = await client.view(payload);
        setStats(view);
        console.log("view here ", view);
      } catch (error) {
        console.log("register error", error);
        const transaction = {
          arguments: [],
          function: `${process.env.REACT_APP_ADDRESS}::wordle::register`,
          type_arguments: [],
        };
        try {
          const pendingTransaction =
            await window.aptos.signAndSubmitTransaction(transaction);
          const client = new AptosClient("https://devnet.aptoslabs.com");
          const txn = await client.waitForTransactionWithResult(
            pendingTransaction.hash
          );
          setTransactionResult(txn);
        } catch (err) {
          console.log(err);
          setError(err);
        }
      }

      const gameStatus = {
        function: `${process.env.REACT_APP_ADDRESS}::wordle::get_game_state`,
        type_arguments: [],
        arguments: [account.address],
      };
      const gs = await client.view(gameStatus);
      console.log("gs here ", gs);
      // const convertHexToChars = (hexStr) => {
      //   // Remove the '0x' prefix and split the string into pairs of two characters
      //   const pairs = hexStr.substring(2).match(/.{1,2}/g);

      //   // Convert each pair from hex to ASCII character
      //   return pairs.map((pair) => String.fromCharCode(parseInt(pair, 16)));
      // };

      // const result = gs.map(convertHexToChars);
      // console.log("result",result);

      const convertHexToChars = (hexStr) => {
        // Ensure hexStr is a string
        if (typeof hexStr !== "string") {
          console.error("Non-string value encountered:", hexStr);
          return [];
        }

        // Remove the '0x' prefix and split the string into pairs of two characters
        const pairs = hexStr.substring(2).match(/.{1,2}/g);

        // Convert each pair from hex to ASCII character
        return pairs.map((pair) => String.fromCharCode(parseInt(pair, 16)));
      };

      let result = gs[0].map(convertHexToChars);

      console.log("result", result);
      console.log("guess", guesses);
      result = Array.from({ length: 6 }, (v, i) => result[i] || []);

      // Ensure each inner array has exactly 5 elements
      result = result.map((subArray) => {
        return Array.from(
          { length: 5 },
          (v, i) => subArray[i] || ""
        );
      });
      console.log("finally resuly", result);
      setGuesses(result);
      // if (result.length == guesses.length) {
      // }
      console.log("guess", guesses);

      setGS(gs);
      console.log("GS here ", GS);
    };

    executeTransaction();
  }, [account]); // Re-run the effect if account changes

  const onReset = async () => {
    try {
      if (GS[0].length != 0) {
        const transaction = {
          arguments: [],
          function: `${process.env.REACT_APP_ADDRESS}::wordle::reset`,
          type_arguments: [],
        };
        try {
          const pendingTransaction =
            await window.aptos.signAndSubmitTransaction(transaction);
          const client = new AptosClient("https://devnet.aptoslabs.com");
          const txn = await client.waitForTransactionWithResult(
            pendingTransaction.hash
          );
          setTransactionResult(txn);
        } catch (err) {
          console.log("reset",err);
          setError(err);
        }
      }
    } catch (error) {
      console.log(error);
    }
    finally{
    
    setGuesses(Array.from({ length: guessesAllowed }, () => Array(gridSize).fill("")));
      window.location.reload();
    }
  };
  //GAME HERE{}

  const isRowComplete = (row) => {
    return guesses[row].every((cell) => cell !== "");
  };

  const getLetterColor = (rowIndex, cell, colIndex) => {
    // Only color if the word is complete and in the dictionary
    let word = guesses[rowIndex].join("");

    const isCorrectLetter = WORD.includes(cell);
    const isCorrectPosition = WORD[colIndex] === cell;

    const convertToAlternateNumbers = (hexStr) => {
      // Remove the '0x' prefix and get every alternate digit starting from index 1
      const alternateNumbers = hexStr
        .substring(2)
        .split("")
        .filter((_, index) => index % 2 !== 0);

      // Convert the characters to numbers
      return alternateNumbers.map((char) => parseInt(char, 10));
    };
    const result =
      GS[1] !== undefined ? GS[1].map(convertToAlternateNumbers) : guesses;
    try {
      if (result[rowIndex][colIndex] == 2) {
        return "#4caf50"; // Green for correct position
      } else if (result[rowIndex][colIndex] == 1) {
        return "#ff9800"; // Orange for correct letter but wrong position
      } else {
        return "transparent";
      }
    } catch (error) {}

    return "transparent"; // Default background
  };

  // Game status
  const [gameStatus, setGameStatus] = useState("not started"); // ["not started","playing", "won", "lost"]\

  // implementing timer
  const [timer, setTimer] = useState(0);
  const timerRequestRef = useRef(null);
  const startTime = useRef(null);
  const startTimer = () => {
    setGameStatus("playing");
    const updateTimer = (timestamp) => {
      if (startTime.current === null) {
        startTime.current = timestamp;
      }
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
        // for (let i = row - 1; i >= 0; i--) {
        //   let prevWord = guesses[i].join("");
        //   if (word === prevWord) {
        //     toast.error("Already Tried!");
        //     return;
        //   }
        // }

        const executeTransaction = async () => {
          try {
            console.log(
              "encoding",
              guesses[row].map((char) => char.charCodeAt(0))
            );
            const submitGuess = {
              function: `${process.env.REACT_APP_ADDRESS}::wordle::submit_guess`,
              type_arguments: [],
              arguments: [guesses[row].map((char) => char.charCodeAt(0))],
            };
            console.log("guesses here", guesses);
            const pendingTransaction =
              await window.aptos.signAndSubmitTransaction(submitGuess);

            const client = new AptosClient("https://devnet.aptoslabs.com");
            const txn = await client.waitForTransactionWithResult(
              pendingTransaction.hash
            );
            console.log("txn here", txn);
            setTransactionResult(txn);
            console.log("account:", account);
            const payload = {
              function: `${process.env.REACT_APP_ADDRESS}::wordle::get_game_state`,
              type_arguments: [],
              arguments: [account.address],
            };
            try {
              const view = await client.view(payload);
              console.log("gs22 here ", view);
              if (view[0].length != GS) {
                console.log("gs2vew", view[0].length);
                setGS(view[0].length);
                console.log("Upt", GS);
                setGS(view[0].length);
                console.log("Upt2", GS);
              }
            } catch (error) {
              console.log(error);
            }
            // await client.waitForTransaction(txnHash, { checkSuccess: true });
            console.log("insige sg");
          } catch (err) {
            console.log(err);
            console.log("in the catchhhh");
          } finally {
            window.location.reload();
            console.log("finalyyyyy");
          }
          // const submitGuess = {
          //   function:
          //     "0xf351504601d020cc2e0e4e7a43c4840419eff31fa1accb81c5d2a20861397940::wordle::submit_guess",
          //   type_arguments: [],
          //   arguments: [guesses[row].map((x) => word.charCodeAt(x))],
          // };
          // try {
          //   const submit_guess = await client.view(submitGuess);
          //   console.log(submit_guess);
          // } catch (error) {
          //   console.log("sg error", error);
          //   const lastDigit = error % 10;
          //   switch (lastDigit) {
          //     case 1:
          //       break;

          //     default:
          //       break;
          //   }
          // }
        };

        executeTransaction();

        // Word is valid, color the letters
        setGuesses((currentGuesses) => {
          const newGuesses = [...currentGuesses];
          // Trigger a re-render to color the letters
          return newGuesses;
        });

        // When word is valid and new
        // if (word === WORD) {
        //   toast.success("You Guessed It!");
        //   stopTimer();
        //   setGameStatus("won");
        //   inputRefs.current[row].forEach(
        //     (ref) => (ref.current.querySelector("input").disabled = true)
        //   );
        //   //Disable further input after guessing correctly
        //   for (let x = row; x < guessesAllowed; x++) {
        //     for (let y = 0; y < gridSize; y++) {
        //       inputRefs.current[x][y].current.querySelector(
        //         "input"
        //       ).disabled = true;
        //     }
        //   }
        // } else {
        //   // Handle end of game or moving to the next row
        //   if (row === guessesAllowed - 1) {
        //     toast.error("Game Over!");
        //     stopTimer();
        //     setGameStatus("lost");
        //   } else {
        //     inputRefs.current[row + 1][0].current
        //       .querySelector("input")
        //       .focus();
        //   }
        // }
        // Disable the current row
        inputRefs.current[row].forEach(
          (ref) => (ref.current.querySelector("input").disabled = true)
        );
        setGuesses([...guesses]); // Update the state to trigger re-render
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
  const [isModalOpen, setModalOpen] = useState(false);

  if (error) {
    console.log("error hereee", error);
    return <div>Error: {error.message}</div>;
  }
  if (!account) {
    return <div>Loading...</div>;
  }
  if (!account) return <div>Loading...</div>;

  const handleInfoClick = () => {
    const statsTransaction = async () => {
      console.log("Heyy\n\n\n");
      if (!account) return;
      const payload = {
        function:
          "0x7653ff4b28a1da697bf2d75aeed4df1821926cedd0e889379593f2b7847f386e::wordle::get_stats",
        type_arguments: [],
        arguments: [account.address],
      };
      try {
        const view = await client.view(payload);
        setStats(view);
        console.log("view here ", view);
      } catch (error) {
        console.log("register error", error);
      }
    };
    statsTransaction();
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };
  // useEffect((()=>(
  // )), [isModalOpen])
  return (
    <div>
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
        <Tooltip
          style={{ transform: "translate(130px,-80px)", color: "white" }}
          title="See Stats"
        >
          <IconButton onClick={handleInfoClick}>
            <InfoIcon />
          </IconButton>
        </Tooltip>
        {/* Modal Window */}
        <Dialog
          open={isModalOpen}
          onClose={handleModalClose}
          PaperProps={{
            sx: {
              backgroundColor: "black", // Set background color to black
              color: "white", // Set font color to white
            },
          }}
        >
          <DialogTitle>
            Stats
            {/* <IconButton
              edge="end"
              style={{margin: "0px"}}
              onClick={handleModalClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton> */}
          </DialogTitle>
          <DialogContent>
            <DialogContentText
              style={{
                backgroundColor: "black", // Set background color to black
                color: "white", // Set font color to white
              }}
            >
              Played : {stats[0]}
              <br />
              Win % : {stats[1]}
              <br />
              Current Streak : {stats[2]}
              <br />
              <h3>GUESS DISTRIBUTION</h3>
              {/* <span style={{height : "10px", width: "100%", background: "grey", display: "inline-block" }}></span> */}
              {stats[3].map((x, i) => {
                const width = (x * 100) / Math.max(...stats[3]);
                const widthString = width.toString() + "%";
                return (
                  <div>
                    <span
                      key={i}
                      style={{
                        height: "25px",
                        width: widthString,
                        background: "grey",
                        display: "inline-block",
                      }}
                    ></span>
                    <span
                      style={{
                        fontWeight: "bold",
                        position: "absolute",
                        left: "30px",
                      }}
                    >
                      {x}
                    </span>
                  </div>
                );
              })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose}>Close</Button>
          </DialogActions>
        </Dialog>

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
                      background: letterColor,
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
        <Typography variant="h4" sx={{ color: "white" }}>
          Timer: {formatTime(timer)}{" "}
        </Typography>
        {/* <p>
        Account Address: <code>{address}</code>
      </p>
      <p>
        Sequence Number: <code>{account?.sequence_number}</code>
      </p> */}
        <ThemeProvider theme={theme}>
          <Button variant="outlined" onClick={onReset}>
            Reset
          </Button>
        </ThemeProvider>
      </Container>
    </div>
  );
};

export default App;
