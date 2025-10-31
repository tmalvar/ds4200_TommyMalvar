// not trying to over-engineer this, just grouped bars with a nested band
const m = { top:40, right:30, bottom:110, left:70 };
const w = 840, h = 460;
const iw = w - m.left - m.right, ih = h - m.top - m.bottom;

const svg = d3.select("#bars").append("svg").attr("width", w).attr("height", h);
const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

// x0 = platform groups, x1 = post types inside each platform
const x0 = d3.scaleBand().range([0, iw]).paddingInner(0.2);
const x1 = d3.scaleBand().padding(0.12);
const y  = d3.scaleLinear().range([ih, 0]);

// just picking three greens for image/link/video (order from CSV)
const color = d3.scaleOrdinal().range(["#2e7d32","#66bb6a","#a5d6a7"]);

const gx = g.append("g").attr("class","axis").attr("transform", `translate(0,${ih})`);
const gy = g.append("g").attr("class","axis");

// labels for axes
g.append("text").attr("x", iw/2).attr("y", ih+70).attr("text-anchor","middle").text("Platform");
g.append("text").attr("transform","rotate(-90)").attr("x",-ih/2).attr("y",-50).attr("text-anchor","middle").text("Average Likes");

// the csv is already summarized (one row per Platform/PostType), so straight to plotting
d3.csv("SocialMediaAvg.csv").then(data=>{
  data.forEach(d => d.AvgLikes = +d.AvgLikes); // got burned by strings before, so forcing number

  const platforms = Array.from(new Set(data.map(d=>d.Platform)));
  const postTypes = Array.from(new Set(data.map(d=>d.PostType)));

  x0.domain(platforms);
  x1.domain(postTypes).range([0, x0.bandwidth()]);
  y.domain([0, d3.max(data, d=>d.AvgLikes)]).nice();
  color.domain(postTypes);

  // my labels were long so I tilted them
  gx.call(d3.axisBottom(x0))
    .selectAll("text").style("text-anchor","end")
    .attr("transform","rotate(-25) translate(-4,0)");
  gy.call(d3.axisLeft(y));

  // this map just lets me grab rows for each platform quickly
  const byPlat = d3.group(data, d=>d.Platform);

  // one <g> per platform, then rectangles inside for each PostType
  const gPlat = g.selectAll(".g-plat")
    .data(platforms).enter().append("g")
    .attr("class","g-plat")
    .attr("transform", d=>`translate(${x0(d)},0)`);

  gPlat.each(function(platform){
    const rows = byPlat.get(platform) || [];
    const gp = d3.select(this);
    gp.selectAll("rect")
      .data(rows).enter().append("rect")
      .attr("x", d=>x1(d.PostType))
      .attr("y", d=>y(d.AvgLikes))
      .attr("width", x1.bandwidth())
      .attr("height", d=> ih - y(d.AvgLikes))
      .attr("fill", d=>color(d.PostType));
  });

  // quick legend so colors mean something
  const legend = g.append("g").attr("transform", `translate(${iw - 140}, 0)`);
  legend.selectAll("rect")
    .data(postTypes).enter().append("rect")
    .attr("x",0).attr("y",(d,i)=>i*20+2)
    .attr("width",12).attr("height",12)
    .attr("fill", d=>color(d))
    .attr("stroke","#000").attr("stroke-width",0.5);

  legend.selectAll("text")
    .data(postTypes).enter().append("text")
    .attr("x",20).attr("y",(d,i)=>i*20+12)
    .text(d=>d)
    .attr("alignment-baseline","middle");
});
