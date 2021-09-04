import './App.css';
import {useEffect, useState} from 'react'
import './spinner.css'
import Swal from 'sweetalert2'

function App({socket}) {
  const [play,setPlay] = useState(false)
  const [gameId,setGameId] = useState("")
  const [playerColor,setPlayerColor] = useState("");
  const [gameState,setGameState] = useState([]);
  const [cellState, setCellState] = useState({});
  const [totalPlayer, setTotalPlayer] = useState(0);

  // it creates a game
  const createGame = ()=>{
    socket.emit('create',{clientId:socket.id})
  }
  const joinGame = ()=>{
    if(gameId===""){
      Swal.fire({
        title: 'Error!',
        text: 'Create a game Id first',
        icon: 'error',
      })
      return;
    }
    const payload = {
      "clientId":socket.id,
      "gameId":gameId
    }
    socket.emit('join',payload)
    
  }

  const clickCells = (ballId) =>{
    const payload = {
      "clientId":socket.id,
      "gameId":gameId,
      "ballId":ballId,
      "color": playerColor
    }
    socket.emit('play',payload);
  }

  useEffect(()=>{
    socket.on('create',({game})=>{
        setGameId(game.id)
        Swal.fire({
          title: "Game ID Created",
          text:"Click on the join button",
          icon:'success',
        })
    })
  },[])
  useEffect(()=>{
    socket.on('join',(data)=>{
        const game = data;
        if(data.wrong){
          Swal.fire({
            title: 'Error!',
            text: 'Wrong game id',
            icon: 'error',
          })
          return;
        }
        setPlay(true)
        game.clients.forEach(c=>{
          if(c.clientId===socket.id) setPlayerColor(c.color)
        })
        setTotalPlayer(game.clients.length)
    })
  },[])
  useEffect(()=>{
    socket.on('update',(data)=>{
        if(!data.state) return;
        setCellState(data.state);
    })
  },[])
  

  return (
    <div className="App">
      <div >
        {!play?<div className="box"><div>
          <input type="text" placeholder="Enter id" value={gameId} onChange={(e)=>setGameId(e.target.value)}/>
          <p style={{color:"green"}}>Share the Game Id with someone you care</p><br/>
          <button onClick={createGame} className="w3-red btn" disabled={gameId===""?false:true}>Create GameID</button>
          <button onClick={joinGame} className="w3-green btn">Joined Game</button></div></div>:
          <GameBox 
            socket={socket}
            setPlay={setPlay}
            gameId={gameId}
            playerColor={playerColor} 
            totalPlayer={totalPlayer} 
            cellState={cellState} 
            gameState={gameState} 
            setGameState={setGameState} 
            clickCells={clickCells} />
        }
      </div>
    </div>
  );
}

const GameBox = ({clickCells,gameState,setGameState,cellState,totalPlayer,playerColor,socket,setPlay,gameId}) =>{
  const [disable, setDisable] = useState(true);
  const [startTimer, setStartTimer] = useState(5);
  const [progress, setProgress] = useState(0);

  const countScore = () =>{
    socket.emit('over',gameId);
  }
  
  useEffect(()=>{
    initialCells()
  },[])
  useEffect(()=>{
    socket.on('over',(winner)=>{
      Swal.fire({
        title: 'Winner',
        text: winner+' the game',
        icon: 'success',
      })
    })
  },[])

  useEffect(()=>{
    socket.on('discon',(res)=>{
      if(res){
        Swal.fire({
          title: 'Warning',
          text: "The other player left the game",
          icon: 'warning',
        })
        setPlay(false);
        return;
      }
    })
  },[])

  useEffect(()=>{
    let timeout = null;
    let interval = null;
    if(totalPlayer===2){
      interval = setInterval(()=>{
        setStartTimer((prev)=>prev-1)
      },1000)
      timeout = setTimeout(()=>{
        setDisable(false);
        clearInterval(interval)
        let progressTemp = progress
        interval = setInterval(()=>{
          setProgress(prev=>prev+2)
          progressTemp = progressTemp+2
          if(progressTemp>=60){
            countScore()
            clearInterval(interval)
          }
        },1000)
      },5000)
    }
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  },[totalPlayer])


  const initialCells = () =>{
    const grid = []
    for(let i=1;i<=20;i++){
        grid.push(i)
    }
    setGameState(grid)
  }


  return (
    <div >
      <div className="fixedInfo">
        <ul>
          <li>
            Your color<br/>
            <div style={{background:playerColor,width:"40px",height:"40px"}}></div>
            </li>
        </ul>
      </div>
      {totalPlayer===2?<>
      {disable?<div className="timer">Game will start in {startTimer}</div>:null}
      <div className="w3-border typingGrid-0 w3-grey">
                <div className="w3-red" style={{height:"10px",width:`${progress}%`}}></div>
            </div>
      <div className="gridBox">
        {gameState.map((val,index)=>(
          <button 
            className="gridButton" 
            disabled={disable}
            style={{background:cellState[(index+1)],color:'white'}} 
            onClick={()=>clickCells((index+1))} key={index}>{(val)}</button>
        ))}
      </div></>:
      <div style={{width:"100vw",height:"100vh",display:"grid",placeItems:"center"}}>
        <Spinner/>  
      </div>}
    </div>
  );
}



const Spinner = () =>{
  return(
    <div style={{fontWeight:"bold",textAlign:"center"}}>
        Game starts after the other player join<br/>
        
    <div className="loadingio-spinner-magnify-23nme9tf1r2"><div className="ldio-jy0cwj72g6s">
<div><div><div></div><div></div></div></div>
</div></div></div>
  );
}

export default App;
