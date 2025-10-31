// keeping margins small so it fits on laptop
const m = { top: 40, right: 30, bottom: 80, left: 60 };
const w = 760, h = 420;
const iw = w - m.left - m.right, ih = h - m.top - m.bottom;

// making the svg + a group I can move around
const svg = d3.select("#boxplot").append("svg").attr("width", w).attr("height", h);
const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

// band for groups, linear for likes (basic)
const x = d3.scaleBand().padding(0.35).range([0, iw]);
const y = d3.scaleLinear().range([ih, 0]);

// axes go here so I can call() later
const gx = g.append("g").attr("class","axis").attr("transform", `translate(0,${ih})`);
const gy = g.append("g").attr("class","axis");

// axis labels so TA knows what’s what
g.append("text").attr("x", iw/2).attr("y", ih+50).attr("text-anchor","middle").text("Age Group");
g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-42).attr("text-anchor","middle").text("Likes");

// I’m just computing the usual 5-number summary for each group
function summarize(rows){
  const v = rows.map(d=>d.Likes).sort(d3.ascending);
  const q1 = d3.quantileSorted(v, 0.25);
  const med = d3.quantileSorted(v, 0.50);
  const q3 = d3.quantileSorted(v, 0.75);
  return { min:d3.min(v), q1, median:med, q3, max:d3.max(v), iqr:q3-q1 };
}

// loading the given csv (case sensitive name I used in earlier parts)
d3.csv("socialMedia.csv").then(data=>{
  data.forEach(d=> d.Likes = +d.Likes); // if I forget this, y-scale breaks

  const groups = Array.from(new Set(data.map(d=>d.AgeGroup)));
  x.domain(groups);
  y.domain([0, d3.max(data, d=>d.Likes)]).nice();

  gx.call(d3.axisBottom(x));
  gy.call(d3.axisLeft(y));

  // grouping by AgeGroup then drawing each box one by one
  const statsByGroup = d3.rollup(data, summarize, d=>d.AgeGroup);

  statsByGroup.forEach((s, k)=>{
    const x0 = x(k), bw = x.bandwidth();

    // whisker: I’m just going min→max per the prompt (easier than 1.5*IQR)
    g.append("line")
      .attr("x1", x0 + bw/2).attr("x2", x0 + bw/2)
      .attr("y1", y(s.min)).attr("y2", y(s.max))
      .attr("stroke","#333").attr("stroke-width",2);

    // the actual box (q1→q3). went with a light green fill to stay on-theme
    g.append("rect")
      .attr("x", x0 + bw*0.15)
      .attr("y", y(s.q3))
      .attr("width", bw*0.70)
      .attr("height", Math.max(1, y(s.q1) - y(s.q3)))
      .attr("fill", "#e6fff0")
      .attr("stroke", "#2e7d32").attr("stroke-width",2);

    // median line so we can compare centers quickly
    g.append("line")
      .attr("x1", x0 + bw*0.15).attr("x2", x0 + bw*0.85)
      .attr("y1", y(s.median)).attr("y2", y(s.median))
      .attr("stroke", "#2e7d32").attr("stroke-width", 2.5);
  });
});
