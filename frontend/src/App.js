import React from 'react'
import Axios from 'axios'
import logo from './logo.svg'
import './App.css'
let config = require("./config.json")

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      data: null
    }
  }
  componentWillMount() {
    Axios.get(config.server_ip).then(response => {
      this.setState({
        data: response.data
      })
    }).catch(err => {
      this.setState({
        data: null
      })
    })
  }
  statisticsPage() {
    return (
      <div>
        {JSON.stringify(this.state.data)}
      </div>
    )
  }
  render() {
    return (
      <div className="App">
        {this.state.data ? 
          this.statisticsPage()
          :
          <div>
            Data not available
          </div>}
      </div>
    )
  }
}

export default App;
