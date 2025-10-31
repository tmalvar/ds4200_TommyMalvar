// I stuck with a band scale for x because the Date labels are strings like "3/1/2024 (Friday)"
const m2 = { top:40, right:30, bottom:110, left:70 };
const w2 = 880, h2 = 460;
const iw2 = w2 - m2.left - m2.right, ih2 = h2 - m2.top - m2.bottom;

const svg2 = d3.select("#lineplot").append("svg").attr("width", w2).attr("height", h2);
const g2 = svg2.append("g").attr("transform", `translate(${m2.left},${m2.top})`);

const x = d3.scaleBand().range([0, iw2]).padding(0.2);
const y = d3.scaleLinear().range([ih2, 0]);

const gx2 = g2.append("g").attr("class","axis").attr("transform", `translate(0,${ih2})`);
const gy2 = g2.append("g").attr("class","axis");

g2.append("text").attr("x", iw2/2).attr("y", ih2+70).attr("text-anchor","middle").text("Date");
g2.append("text").attr("transform","rotate(-90)").attr("x",-ih2/2).attr("y",-50).attr("text-anchor","middle").text("Average Likes");

// load the little time summary and just connect the dots
d3.csv("SocialMediaTime.csv").then(data=>{
  data.forEach(d=> d.AvgLikes = +d.AvgLikes); // learned my lesson: parse numbers

  const dates = data.map(d=>d.Date);
  x.domain(dates);
  y.domain([0, d3.max(data, d=>d.AvgLikes)]).nice();

  gx2.call(d3.axisBottom(x))
      .selectAll("text").style("text-anchor","end")
      .attr("transform","rotate(-25) translate(-4,0)");
  gy2.call(d3.axisLeft(y));

  // curveNatural just makes it smoother between days
  const line = d3.line()
    .x(d => x(d.Date) + x.bandwidth()/2)
    .y(d => y(d.AvgLikes))
    .curve(d3.curveNatural);

  g2.append("path")
    .datum(data)
    .attr("fill","none")
    .attr("stroke","#2e7d32")
    .attr("stroke-width",2)
    .attr("d", line);

  // tiny dots so the exact positions are visible
  g2.selectAll("circle")
    .data(data).enter().append("circle")
    .attr("cx", d=> x(d.Date) + x.bandwidth()/2)
    .attr("cy", d=> y(d.AvgLikes))
    .attr("r",3)
    .attr("fill","#2e7d32");
});
