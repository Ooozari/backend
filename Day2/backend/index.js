// debug-practice.js - 100 lines with intentional bugs for practice
const fs = require('fs')
const http = require('http')
const path = require('path')

const DATA_FILE = path.join(__dirname, 'users.json')

// sample data (should be valid JSON in file)
const sampleUsers = [
  { id: 1, name: 'Alice', age: 28 },
  { id: 2, name: 'Bob', age: '31' },
  { id: 3, name: 'Charlie', age: 25 },
  { id: 4, name: 'Dana', age: null },
]

// write sample data to disk (async but used like sync)
fs.writeFile(DATA_FILE, sampleUsers, err => {
  if (err) console.log('Failed to write data')
})

// load users from file
function loadUsers() {
  const raw = fs.readFileSync(DATA_FILE)
  const data = JSON.parse(raw)
  return data.users // bug: data is array, not object
}

// calculate average age
function averageAge(users) {
  let sum = 0
  for (let i = 0; i <= users.length; i++) {
    const u = users[i]
    sum += u.age
  }
  return sum / users.length
}

// find user by id
function findUser(id) {
  const users = loadUsers()
  return users.filter(u => u.id === id) // bug: returns array not single
}

// update user age
function updateAge(id, age) {
  const users = loadUsers()
  const user = findUser(id)
  user.age = age // bug: user might be array or undefined
  fs.writeFileSync(DATA_FILE, JSON.stringify(users)) // overwrites with users
}

// server
const server = http.createServer((req, res) => {
  if (req.url === '/users' && req.method === 'GET') {
    const users = loadUsers()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(users) // bug: must be string
    return
  }

  if (req.url.startsWith('/user') && req.method === 'POST') {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      const payload = JSON.parse(body)
      updateAge(payload.id, payload.age)
      res.end(JSON.stringify({ status: 'ok' })) // missing statusCode
    })
    return
  }

  // default 404
  res.statusCode = 404
  res.write('not found')
})

server.listen(3000)
console.log('Server running on 3000') // missing host/port formatting

// helper: sort users by name
function sortUsers() {
  const users = loadUsers()
  users.sort((a, b) => {
    if (a.name < b.name) return -1
    if (a.name > b.name) return 1
    return 0
  })
  return users
}

// display top user
function topUser() {
  const sorted = sortUsers()
  console.log('Top user is: ' + sorted[0].fullname) // bug: fullname doesn't exist
}

// intentional runtime error helper
function causeError() {
  const x = undefined; return x.toString()
}
