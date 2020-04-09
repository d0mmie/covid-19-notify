import axios from 'axios'
import moment from 'moment'
import qs from 'qs'

moment.locale('th')

console.log('APP STARTED')

const defaultSleepTime = parseInt(process.env.DEFAULT_SLEEP_TIME, 10)
const errorSleepTime = parseInt(process.env.ERROR_SLEEP_TIME, 10)

const sleep = (ms) => new Promise((resolve) => {
    setTimeout(() => {
        resolve()
    }, ms)
})

async function fetchCovid(previous, areaSelection) {
    try {
        const { data } = await axios.get('https://covid19.th-stat.com/api/open/today')
        if (previous && data.UpdateDate !== previous.UpdateDate) {
            console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} UPDATED`)
            const newAreaSelection = await axios.get(`https://opend.data.go.th/get-ckan/datastore_search_sql?sql=SELECT * from "5c91fc06-72c4-40fd-b426-bf2dfb9b27f4" WHERE _id = ${process.env.AREA_SELECTION}&api-key=${process.env.API_KEY}`)
            await axios.post('https://notify-api.line.me/api/notify', qs.stringify({
                message: `\n@[${moment(data.UpdateDate, 'DD/MM/YYYY HH:mm').format('DD MMMM YYYY HH:mm')}]\n\nยอดผู้ติดเชื้อ: ${data.Confirmed} (เพิ่ม ${data.NewConfirmed} ราย)\n\nกลับบ้านแล้ว: ${data.Recovered} (เพิ่ม ${data.NewRecovered} ราย)\n\nเสียชีวิต: ${data.Deaths} (เพิ่ม ${data.NewDeaths} ราย)\n\nเข้ารับการรักษา: ${data.Hospitalized} (เพิ่ม ${data.NewHospitalized} ราย)\n\nพื้นที่ ${newAreaSelection.data.result.records[0].Province}: ${newAreaSelection.data.result.records[0]['Count of no']} (เพิ่ม ${parseInt(newAreaSelection.data.result.records[0]['Count of no'], 10) - parseInt(areaSelection.data ? areaSelection.data.result.records[0]['Count of no'] : newAreaSelection.data.result.records[0]['Count of no'], 10)} ราย)`
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${process.env.LINE_NOTIFY_TOKEN}`
                }
            })
            await sleep(defaultSleepTime)
            await fetchCovid(data, newAreaSelection)
        } else {
            console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} NOT UPDATED`)
            await sleep(defaultSleepTime)
            await fetchCovid(data, areaSelection)
        }
    } catch (e) {
        console.log(`${moment().format('YYYY-MM-DD HH:mm:ss')} ERROR`)
        await sleep(errorSleepTime)
        await fetchCovid(previous, areaSelection)
    }
}

fetchCovid({ UpdateDate: '' }, {})