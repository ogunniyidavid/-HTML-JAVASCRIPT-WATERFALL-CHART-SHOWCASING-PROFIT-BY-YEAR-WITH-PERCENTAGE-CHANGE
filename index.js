const margin = { top: 80, right: 30, bottom: 30, left: 50 };
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const padding = 0.3;


const x = d3
  .scaleBand()
  .rangeRound([ 0, width ])
  .padding(padding);

const y = d3
  .scaleLinear()
  .range([ height, 0 ]);

const xAxis = d3.axisBottom(x);

const yAxis = d3
  .axisLeft(y)
  .tickFormat((d) => {
    return d;
  })
  // .adding tooltip

const tooltip = d3.select("svg").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0)
     .attr("align","middle")
     .style('position', 'absolute');


const chart = d3
  .select('.chart')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', `translate(${ margin.left },${ margin.top })`);

const type = (d) => {
  d.value = +d.value;
  return d;
}; // type

const eurFormat = (amount) => {
  if (Math.abs(amount) > 1000000) {
    return `${ Math.round(amount / 1000000) }M£`;
  }
  if (Math.abs(amount) > 1000) {
    return `${ Math.round(amount / 1000) }K£`;
  }
  return `${ amount }£`;
}; // eurFormat

const drawWaterfall = (data) => {
  x.domain(data.map((d) => {
    return d.name;
  }));

  y.domain([
    0,
    d3.max(data, (d) => {
      return d.end;
    })
  ]);


// X axis
  chart
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${ height })`)
    .call(xAxis);
  chart
    .append("text")
    .attr("x", 420 )
    .attr("y", 420 )
    .style("text-anchor", "middle")
    .text("Months");  // labelling x axis

// Y axis
  chart
    .append('g')
    .attr('class', 'y axis')
    .call(yAxis);
  chart
    .append("text")
    .attr("x", 0 )
    .attr("y", 1 )
    .style("text-anchor", "middle")
    .text("Profit");  // labelling y axis

    chart
    .append("text")
    .attr('x', x.bandwidth() / 2)
    .attr('y', (0 - margin.top) / 2)
    .style("text-anchor", "middle")
    .text("% change");  // labelling the ellipse

  const bar = chart.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', (d) => {
      return `bar ${ d.class }`;
    })
    .attr('transform', (d) => {
      return `translate(${ x(d.name) },0)`;
    });

  bar
    .append('rect')
    .attr('y', (d) => {
      return y(Math.max(d.start, d.end));
    })
    .attr('height', 0)
    .attr('width', x.bandwidth())
    
    .transition()
    .duration(1000)
    .attr('height', (d) => {
      return Math.abs(y(d.start) - y(d.end));
    })
   
    d3.selectAll('rect')
    .append('title')
    .text(d=> `Profit: ${eurFormat(d.value)}  Month: ${(d.name)}`) // showing profit and month
  
  // Add the value on each bar
  bar
    .append('text')
    .transition()
    .duration(1000)
    .attr('x', x.bandwidth() / 2)
    .attr('y', (d) => {
      return d.class === 'positive' ? y(d.end) : y(d.start);
    })
    .attr('dy', '-.5em')
    .text((d) => {
      return d.class === 'total' ? eurFormat(d.start - d.end) : eurFormat(d.end - d.start);
    })
    .style('fill', 'black');


  bar
    .filter((d, i) => {
      // filter out first bar and total bars
      return (d.class !== 'total' && i !== 0);
    })
    .append('ellipse')
    .attr('class', 'bubble')
    .attr('class', 'ellipse')
    .attr('cx', x.bandwidth() / 2)
    .attr('cy', (0 - margin.top) / 2)
    .attr('rx', 30)
    .attr('ry', '1em');

  bar
    .filter((d, i) => {
      // filter out first bar and total bars
      return (d.class !== 'total' && i !== 0);
    })
    .append('text')
    .attr('x', x.bandwidth() / 2)
    .attr('y', (0 - margin.top) / 2)
    .attr('dy', '.3em')
    .attr('class', 'bubble')
    .text((d) => {
      const percentage = d3.format('.1f')(((100 * (d.end - d.start)) / d.start));
      return `${ percentage }%`;
    });
  

  // Add the connecting line between each bar
  bar
    .filter((d, i) => {
      return i !== data.length - 1;
    })
    .append('line')
    .attr('class', 'connector')
    .attr('x1', x.bandwidth() + 5)
    .attr('y1', (d) => {
      return d.class === 'total' ? y(d.start) : y(d.end);
    })
    .attr('x2', (x.bandwidth() / (1 - padding)) - 5)
    .attr('y2', (d) => {
      return d.class === 'total' ? y(d.start) : y(d.end);
    });
}; // drawWaterfall

const prepData = (data) => {
  // create stacked remainder
  const insertStackedRemainderAfter = (dataName, newDataName) => {
    const index = data.findIndex((datum) => {
      return datum.name === dataName;
    }); // data.findIndex

    return data.splice(index + 1, 0, {
      name: newDataName,
      start: data[index].end,
      end: 0,
      class: 'total',
    }); // data.splice
  }; // insertStackedRemainder

  // retrieve total value
  let cumulative = 0;

  // Transform data (i.e., finding cumulative values and total) for easier charting
  data.map((datum) => {
    datum.start = cumulative;
    cumulative += datum.value;
    datum.end = cumulative;
    return datum.class = datum.value >= 0 ? 'positive' : 'negative';
  }); // data.map

  // insert stacked remainders where approriate
  insertStackedRemainderAfter('June', 'mid-year profit total');
  insertStackedRemainderAfter('December', 'Total Profit');

  return drawWaterfall(data);
}; // prepData


const text = document.querySelector('h2');
d3.csv('data1.csv', type, (error, data) => {
  return   prepData(data);
}); // Updating h2 through the button

// 2011
const btn = document.getElementById('btn');
btn.addEventListener('click', ()=>{
  d3.selectAll("g > *").remove()
  text.innerHTML = '2011';
  const item = d3.csv('data1.csv', type, (error, data) => {
    return prepData(data);
  });
})

// 2012
const btn1 = document.getElementById('btn1');
btn1.addEventListener('click', ()=>{
  d3.selectAll("g > *").remove()
  text.innerHTML = '2012';
  const item = d3.csv('data2.csv', type, (error, data) => {
    return prepData(data);
  });
})

// 2013
const btn2 = document.getElementById('btn2');
btn2.addEventListener('click', ()=>{
  text.innerHTML = '2013';
  d3.selectAll("g > *").remove()
  d3.csv('data3.csv', type, (error, data) => {
    return prepData(data);
  });
})

// 2014
const btn3 = document.getElementById('btn3');
btn3.addEventListener('click', ()=>{
  text.innerHTML = '2014';
  d3.selectAll("g > *").remove()
  d3.csv('data4.csv', type, (error, data) => {
    return prepData(data);
  });
})

