const EC = require("elliptic").ec
const ec = new EC("secp256k1")

class Glasspay{
  constructor(){
    this.users = {}
    this.aliases = {
      bank: pubbank
    }
  }

  genesisAccount(pubkey, username){
    const key = ec.keyFromPublic(pubkey, "hex")
    const time = Date.now()
    const sign = key.sign(pubkey+amount+time).toDER("hex")

    const banksign = bankkey.sign(pubbank, 100000000).toDER("hex")

    this.users[pubkey] = {
      owner: username,
      amount: 100000000,
      time: time,
      signature: sign,
      prev: {
        with: "bank",
        amount: 100000000,
        signature: banksign
      }
    }
  }

  account(pubkey, username){
    const key = ec.keyFromPublic(pubkey, "hex")
    const time = Date.now()
    const sign = key.sign(pubkey+amount+time).toDER("hex")

    this.users[pubkey] = {
      owner: username,
      amount: 0,
      time: time,
      signature: sign
    }
  }

  digest(user){
    const pub = this.aliases[user]
    user = this.users[user]

    this.users[pub] = bankkey.sign(user.owner+user.amount+user.time).toDER("hex")
  }

  verify(user){
    const pub = this.aliases[user]
    user = this.users[user]

    if(!user.signature) return false

    const key = ec.keyFromPublic(pub, "hex")
    return key.verify(user.owner+user.amount+user.time, user.signature)
  }

  validPrev(prev, pubkey){
    const pub = this.aliases[prev.with]

    const from = prev.amount >= 0

    if(from && prev.with == "bank"){
      if(this.genesis) return false
      this.genesis = bankkey.sign("genesis").toDER("hex")
    }

    const key = ec.keyFromPublic(from?pub:pubkey, "hex")

    if(from) return key.verify(pub+pubkey+prev.amount, prev.signature)
    return key.verify(pubkey+pub+prev.amount, prev.signature)
  }

  transfer(from, to, amount, signature){
    const userFrom = this.users[this.aliases[from]]
    const userTo = this.users[this.aliases[to]]

    const validfrom = verify(from)
    const validto = verify(to)
    const fromhalal = validPrev(userFrom.prev, pubfrom)
    const tohalal = validPrev(userTo.prev, pubto)
    const validamount = amount > 0

    if(validfrom && validto && fromhalal && tohalal && validamount){
      userFrom.amount -= amount
      userFrom.time = Date.now()
      userFrom.prev = {
        with: to,
        amount: -amount,
        signature: signature
      }
      digest(from)

      userTo.amount += amount
      userTo.time = Date.now()
      userTo.prev = {
        with: from,
        amount: amount,
        signature: signature
      }
      digest(to)
    }
  }
}
