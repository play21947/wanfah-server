import express, { json } from 'express'
import cors from 'cors'
const app = express()
import { db } from './config.js'
import { getDocs, collection, deleteDoc, doc, getDoc, where, query, updateDoc } from 'firebase/firestore'
import process from 'process'
import chalk from 'chalk'
import axios from 'axios'
import dotenv from 'dotenv'
// import mysql from 'mysql2'

let env = dotenv.config().parsed

app.use(cors())
app.use(express.json())

const Welcome = async () => {
    console.log(chalk.bgBlue(`
    --------- Server วาฬฟ้า is running ---------
            url : https://localhost:3001        
    --------------------------------------------
`))
}

const CheckMemoryUsage = () => {
    // console.log("Free Memory : ", os.freemem())
    // console.log("Total Memory : ", os.totalmem())
    let arrayMemoryUsage = Object.entries(process.memoryUsage())

    arrayMemoryUsage.map((item) => {
        console.log(chalk.bgGreen(`${item[0]} => ${(item[1] / 1024 / 1024 * 100) / 100} MB`))
    })
}

Welcome()
CheckMemoryUsage()

// const db = mysql.createConnection({
//     host: 'localhost'
// })

// console.log(Object.entries(process.memoryUsage()))



// Delete Orders When orders expires

// Burn My firestore

// setInterval(async () => {
//     let current_time = new Date().getTime()

//     let orders_data = await getDocs(collection(db, 'orders')).then((res) => {
//         let data = res.docs.map((item) => {

//             return {
//                 ...item.data(),
//                 orderId: item.id
//             }
//         })

//         return data
//     })

//     orders_data.map((item) => {
//         let diffTime = item.timestampEnd - current_time

//         if (diffTime <= 0 && !item.payment_success) {
//             deleteDoc(doc(db, "orders", item.orderId)).then((res) => {
//                 console.log("Deleted Timeout Orders Sucessfully")
//                 // Return Lottery Can Buy to shop

//                 updateDoc(doc(db, 'users', item.userId), {
//                     orderId: ''
//                 }).then(() => {
//                     console.log("OrderId Delete in user")

//                     if (item.cart && item.cart.length > 0) {
//                         item.cart.map((itemCart) => {
//                             updateDoc(doc(db, "lottery", itemCart.lotteryId), {
//                                 lock: false
//                             }).then(() => {
//                                 console.log(chalk.green(`${itemCart.lotteryId} can buy`))
//                             })
//                         })
//                     } else {
//                         console.error("No item in cart")
//                     }
//                 })

//             })
//         }
//     })
// }, 1000)



// setInterval(async () => {
//     let current_time = new Date().getTime()

//     let users_data = await getDocs(query(collection(db, 'users'), where("lockEnd", "!=", null))).then((res) => {
//         let data = res.docs.map((item) => {
//             return {
//                 ...item.data(),
//                 userId: item.id
//             }
//         })

//         return data
//     })

//     users_data.map(async (user) => {

//         let diffTime = user.lockEnd - current_time

//         if (diffTime <= 0) {
//             user.cart.map(async (lottery) => {
//                 await updateDoc(doc(db, 'lottery', lottery.lotteryId), {
//                     lock: false
//                 })
//             })

//             await updateDoc(doc(db, 'users', user.userId), {
//                 lockEnd: null,
//                 cart: []
//             })

//             let currentTime = new Date().getDate()
//             console.log(chalk.bgGreen(`Reset Cart (userCart, LotteryLock, deleteLockEnd) => ${currentTime}`))
//         }
//     })
// }, 1000)


// GroupId : C50d6008e31f79c1b01d67ec9d7152b14


app.get("/test", (req, res) => {
    console.log("test")
    res.json("Testing")
})

app.post("/webhook", (req, res) => {
    if (req.body.events && req.body.events.length > 0) {
        console.log(req.body.events)
        let group = req.body.events[0].source.groupId
        console.log(group)

    }
    res.json(200)
})


app.post("/notify", async (req, res) => {
    let maintenance = 5
    let { name, lastName, numberPhone, total, slip_img, cart, way } = req.body
    let cartJson = JSON.parse(cart)
    let combine_array_lottery = ''
    let totalQuantity

    if (cartJson && cartJson.length > 0) {
        totalQuantity = cartJson.reduce((total, current) => {
            return total = total + current.quantity
        }, 0)
    }

    console.log("Notify Start")

    await cartJson.map((item, index) => {
        if (index == 0) {
            combine_array_lottery = combine_array_lottery + `${item.number}`
        } else {
            combine_array_lottery = combine_array_lottery + ` ${item.number}`
        }
    })

    let CartTextShow = combine_array_lottery.replace(' ', ',')

    console.log(combine_array_lottery)
    // console.log(chalk.red("IMG SLIP DATA : ", slip_img))
    await axios.post("https://api.line.me/v2/bot/message/push", {
        to: 'C50d6008e31f79c1b01d67ec9d7152b14',
        messages: [
            {
                type: 'text',
                text: `คุณ ${name} ${lastName} \nเบอร์โทร : ${numberPhone} \n ช่องทาง : ${way == 'ems' ? 'ส่ง EMS +50 บาท' : 'ปกติ'} \nยอด : ${way == 'ems' ? (total + (totalQuantity * maintenance)) + 50 : (total + (totalQuantity * maintenance))} บาท \nหวยที่ซื้อ : ${CartTextShow} \nจำนวน : ${totalQuantity} ใบ`
            },
            {
                type: 'image',
                originalContentUrl: slip_img,
                previewImageUrl: slip_img
            }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`
        }
    }).then((res) => {
        console.log(res)
    })
})

app.get("/unlockLotteryAll", async (req, res) => {
    let lotteryGets = await getDocs(collection(db, 'lottery'))
    let allLottery = lotteryGets.docs.map((item) => {
        return {
            ...item.data(),
            lotteryId: item.id
        }
    })

    allLottery.map((item) => {
        updateDoc(doc(db, 'lottery', item.lotteryId), {
            lock: false
        })
    })

    console.log(chalk.green("Unlock All Lottery Successfully!"))
})

app.get('/api/getLotteryResult', async (req, res) => {

    let data = await axios.post('https://www.glo.or.th/api/lottery/getLatestLottery').then((res) => {
        return res.data
    })


    res.json({ status: 200, data: data })
})


app.post('/api/winLottery', async (req, res) => {
    let { name, lastName, amountWin, lotteryWin, numberPhone, userId } = req.body
    let totalQuantity
    let arrayLotteryWin = []

    let convertLottery = JSON.parse(lotteryWin)

    let textWin = ''

    console.log(Number(amountWin).toLocaleString('th-TH'))

    await convertLottery.map((item) => {
        textWin = textWin + item.userNumber + ','
        arrayLotteryWin.push(item.userNumber)
    })

    totalQuantity = convertLottery.reduce((total, current) => {
        return total = total + current.quantity
    }, 0)



    await axios.post("https://api.line.me/v2/bot/message/push", {
        to: 'C50d6008e31f79c1b01d67ec9d7152b14',
        messages: [
            {
                type: 'text',
                text: `ถูกรางวัล!!🥳 ${Number(amountWin).toLocaleString('th-TH')} บาท \nคุณ ${name} ${lastName} \nเบอร์โทร : ${numberPhone} \nหวยที่ถูก : ${textWin} \nจำนวน : ${totalQuantity} ใบ`
            },
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`
        }
    }).then((res) => {
        updateDoc(doc(db, 'users', userId), {
            win_lottery: arrayLotteryWin,
            amountWin: amountWin,
            transaction: false
        })
    })


    res.json({ status: 200 })
})


app.get("/api/win_lists", async (req, res) => {

    let sortLotteryReward = []
    let arrayUserLottery = []


    let lottery_result = await axios.get('https://wanfah-server-production.up.railway.app/api/getLotteryResult').then((res) => {
        return res.data
    })

    let reward = Object.entries(lottery_result.data.response.data)
    let data = Object.entries(lottery_result.data.response.data)

    // arrayLottery = lottery_result.data.response.data

    reward.map((item) => {
        item[1].number.map((items) => {
            sortLotteryReward.push({ ...items, reward: item[0], price: item[1].price })
        })
    })

    let order = await getDocs(query(collection(db, 'orders'))).then((res) => {
        let payload = res.docs.map((item) => {
            return {
                ...item.data(),
                orderId: item.id
            }
        })

        return payload
    })

    order.map((item) => {
        item.cart.map((items) => {
            arrayUserLottery.push(items)
        })
    })


    let find = arrayUserLottery.map((item) => {

        // console.log("User Cart : ", item)

        let data = sortLotteryReward.filter((itemGov) => {
            return item.number.includes(itemGov.value)
        })

        let payload = {
            ...data.shift(),
            userNumber: item.number,
            quantity: item.quantity //ซื้อหวยกี่ใบต่อ 1 order
        }

        return payload
    })

    // console.log("Find Something : ", find)



    find.map((item) => {

        if (item.reward == "first") {
            if (item.userNumber == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลที่ 1'
                }
                console.log('ถูกรางวัลที่ 1', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == "second") {
            if (item.userNumber == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลที่ 2'
                }
                console.log('ถูกรางวัลที่ 2', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == 'third') {
            if (item.userNumber == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลที่ 3'
                }
                console.log('ถูกรางวัลที่ 3', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == 'fourth') {
            if (item.userNumber == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลที่ 4'
                }
                console.log('ถูกรางวัลที่ 4', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == 'fifth') {
            if (item.userNumber == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลที่ 5'
                }
                console.log('ถูกรางวัลที่ 5', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == 'last2') {

            let userNum1 = item.userNumber[4]
            let userNum2 = item.userNumber[5]
            let valueNum1 = item.value[0]
            let valueNum2 = item.value[1]

            let combine = userNum1.toString() + userNum2.toString()

            if (combine == item.value) {

                let payload = {
                    ...item,
                    text: 'ถูกรางวัล 2 ตัวท้าย'
                }

                console.log('ถูกรางวัล 2 ตัวท้าย', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

        if (item.reward == 'last3f') {
            let userNum1 = item.userNumber[0]
            let userNum2 = item.userNumber[1]
            let userNum3 = item.userNumber[2]

            let combine = userNum1.toString() + userNum2.toString() + userNum3.toString()


            if (combine == item.value) {
                let payload = {
                    ...item,
                    text: 'ถูกรางวัลเลขหน้า 3 ตัว'
                }

                console.log('ถูกรางวัลหน้า 3 ตัว', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }

        }

        if (item.reward == 'last3b') {
            let userNum1 = item.userNumber[3]
            let userNum2 = item.userNumber[4]
            let userNum3 = item.userNumber[5]

            let combine = userNum1.toString() + userNum2.toString() + userNum3.toString()


            if (combine == item.value) {

                let payload = {
                    ...item,
                    text: 'ถูกรางวัลเลขท้าย 3 ตัว'
                }

                console.log('ถูกรางวัลหลัง 3 ตัว', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }

        }

        if (item.reward == 'near1') {
            if (item.userNumber == item.value) {

                let payload = {
                    ...item,
                    text: 'ถูกรางวัลใกล้เคียงรางวัลที่ 1'
                }

                console.log('ถูกรางวัลใกล้เคียง', item.userNumber)
                // setResultReward((prev) => [...prev, payload])
            }
        }

    })
})

app.post("/api/points_to_money", async (req, res) => {

    let {userProfile, amount} = req.body

    let response = await axios.post("https://api.line.me/v2/bot/message/push", {
        to: 'C50d6008e31f79c1b01d67ec9d7152b14',
        messages: [
            {
                type: 'text',
                text: `ต้องการแลกพอยต์เป็นเงินจำนวน ${amount} บาท \nคุณ : ${userProfile.name} ${userProfile.lastName} \nเบอร์โทร : ${userProfile.numberPhone} \nธนาคาร :${userProfile.banking_name ? userProfile.banking_name.name : 'ไม่มี'} \nเลขบัญชีธนาคาร :${userProfile.banking_number ? userProfile.banking_number : 'ไม่มี'}`
            },
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`
        }
    })

    if(response.data){
        res.json({status: 200})
    }


})



app.listen(3001, () => {
    console.log("Server is running on port 3001")
})