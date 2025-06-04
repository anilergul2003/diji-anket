
const express=require('express');
const bodyParser=require('body-parser');
const sqlite3=require('sqlite3').verbose();
const path=require('path');
const app=express();
const PORT=process.env.PORT||3000;

const DBSOURCE="database.sqlite";
const db=new sqlite3.Database(DBSOURCE,(err)=>
{
if (err)
{
console.error(err.message);
throw err;
}
else
{
console.log('SQLite DB bağlandı.');
db.run(`CREATE TABLE IF NOT EXISTS survey(
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT,
age INTEGER,
gender TEXT,
answers TEXT,
totalScore INTEGER,
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
}
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'/')));


app.post('/api/save-survey',(req,res)=>
{
const{user,answers,totalScore}=req.body;
if(!user||!answers||!totalScore)
{
return res.status(400).json({error:"Eksik veri."});
}
const{email,age,gender}=user;
const answersStr=JSON.stringify(answers);

const sql='INSERT INTO survey(email,age,gender,answers,totalScore)VALUES(?,?,?,?,?)';
const params=[email,age,gender,answersStr,totalScore];
db.run(sql,params,function(err)
{
if(err)
{
console.error(err);
return res.status(500).json({error:"Veri kaydedilemedi."});
}
res.json({message:"Veri kaydedildi.",id:this.lastID});
});
});

app.get('/api/admin/stats',(req,res)=>
{
let{ageGroup,gender}=req.query;
let conditions=[];
let params=[];

if(gender)
{
conditions.push("gender=?");
params.push(gender);
}

if(ageGroup)
{
if(ageGroup==="18-25")conditions.push("age BETWEEN 18 AND 25");
else if(ageGroup==="26-35")conditions.push("age BETWEEN 26 AND 35");
else if(ageGroup==="36-50")conditions.push("age BETWEEN 36 AND 50");
else if(ageGroup==="51+")conditions.push("age>=51");
}

const whereClause=conditions.length?"WHERE"+conditions.join("AND"):"";


const sql=`SELECT
CASE
WHEN totalScore BETWEEN 0 AND 30 THEN 'Düşük Bağımlılık'
WHEN totalScore BETWEEN 31 AND 60 THEN 'Orta Bağımlılık'
ELSE 'Yüksek Bağımlılık' END AS label, COUNT(*) AS count
FROM survey
${whereClause}
GROUP BY label`;

db.all(sql,params,(err,rows)=>
{
if(err)
{
console.error(err);
return res.status(500).json({error:"İstatistik alınamadı."});
}
res.json(rows);
});
});


app.get('/api/admin/export-csv',(req,res)=>
{
const sql=`SELECT email,age,gender,totalScore,created_at FROM survey`;
db.all(sql,[],(err,rows)=>
{
if(err)
{
return res.status(500).send("CSV verisi alınamadı.");
}

let csv='E-posta,Yaş,Cinsiyet,Toplam Puan,Tarih\n';
rows.forEach(row=>
{
csv+=`"${row.email}","${row.age}","${row.gender}","${row.totalScore}","${row.created_at}"\n`;
});
res.setHeader('Content-Type','text/csv');
res.setHeader('Content-Disposition','attachment;filename=dijianket_sonuclari.csv');
res.send(csv);
});
});


app.listen(PORT,()=>
{
console.log(`Sunucu${PORT}portunda çalışıyor.`);
});
