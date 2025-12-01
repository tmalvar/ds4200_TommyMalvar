// load the CSV and do all the counting stuff in here
d3.csv("Intramural_Clean.csv").then(function(data) {
  // filter down to games that are forfeits (trying to match the pandas logic)
  const forfeitedGames = data.filter(d =>
    d.Forfeit === "Yes" || d.Forfeit === "Possible"
  );

  // teams that lost via forfeit when they were home
  const homeForfeitLosses = forfeitedGames
    .filter(d => d["Home Result"] === "L")
    .map(d => d["Home Team"]);

  // teams that lost via forfeit when they were away
  const awayForfeitLosses = forfeitedGames
    .filter(d => d["Away Result"] === "L")
    .map(d => d["Away Team"]);

  // mash the two lists together
  const allForfeitLosses = homeForfeitLosses.concat(awayForfeitLosses);

  // kind of like value_counts in pandas
  const forfeitCounts = d3.rollup(
    allForfeitLosses,
    v => v.length,
    d => d
  );

  // only keep teams that forfeited more than once
  const repeatOffenders = new Set(
    Array.from(forfeitCounts.entries())
      .filter(([team, count]) => count > 1)
      .map(([team, count]) => team)
  );

  // map: team -> set of sports that team plays in the data
  const repeatOffenderSports = new Map();
  data.forEach(d => {
    const homeTeam = d["Home Team"];
    const awayTeam = d["Away Team"];
    const sport = d["Sport"];

    if (repeatOffenders.has(homeTeam)) {
      if (!repeatOffenderSports.has(homeTeam)) {
        repeatOffenderSports.set(homeTeam, new Set());
      }
      repeatOffenderSports.get(homeTeam).add(sport);
    }

    if (repeatOffenders.has(awayTeam)) {
      if (!repeatOffenderSports.has(awayTeam)) {
        repeatOffenderSports.set(awayTeam, new Set());
      }
      repeatOffenderSports.get(awayTeam).add(sport);
    }
  });

  // now count: how many repeat-offender teams per sport
  const sportCounts = new Map();
  repeatOffenderSports.forEach((sportsSet, team) => {
    sportsSet.forEach(sport => {
      sportCounts.set(sport, (sportCounts.get(sport) || 0) + 1);
    });
  });

  // convert to array so d3 can use it
  let sportCountsData = Array.from(
    sportCounts,
    ([Sport, RepeatOffenders]) => ({ Sport, RepeatOffenders })
  );

  // sort biggest to smallest
  sportCountsData.sort((a, b) =>
    d3.descending(a.RepeatOffenders, b.RepeatOffenders)
  );

  // basic chart setup
  const margin = { top: 40, right: 20, bottom: 100, left: 60 },
        width = 800 - margin.left - margin.right,
        height = 450 - margin.top - margin.bottom;

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // scales
  const x = d3.scaleBand()
    .domain(sportCountsData.map(d => d.Sport))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(sportCountsData, d => d.RepeatOffenders)])
    .nice()
    .range([height, 0]);

  // basic tooltip div
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // draw bars
  svg.selectAll(".bar")
    .data(sportCountsData)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.Sport))
    .attr("y", d => y(d.RepeatOffenders))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d.RepeatOffenders))
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(
          `<strong>${d.Sport}</strong><br/>Repeat offenders: ${d.RepeatOffenders}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  // y-axis
  svg.append("g").call(d3.axisLeft(y));

  // axis labels
  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height + 70)
    .style("text-anchor", "middle")
    .text("Sport");

  svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .style("text-anchor", "middle")
    .text("Number of Repeat Offender Teams");

  // title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Number of Repeat Offenders per Sport");
}).catch(function(error) {
  console.error("Error loading or processing the CSV:", error);
});
