document.addEventListener('DOMContentLoaded', () => {
    let allData = [];
    let filteredData = [];
    let charts = {};

    // --- Data Loading ---
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            filteredData = [...allData];
            initializeDashboard();
            applyFilters();
        })
        .catch(error => console.error('Error loading data:', error));

    // --- Helper Functions ---
    function updateKPIs() {
        const totalSales = filteredData.reduce((sum, item) => sum + item.Total, 0);
        const avgGrossIncome = filteredData.length > 0 ?
            filteredData.reduce((sum, item) => sum + item.gross_income, 0) / filteredData.length : 0;

        document.getElementById('kpi-total-sales').innerText = `$${totalSales.toFixed(2)}`;
        document.getElementById('kpi-avg-gross-income').innerText = `$${avgGrossIncome.toFixed(2)}`;
    }

    function populateFilters() {
        const cities = [...new Set(allData.map(item => item.City))].sort();
        const customerTypes = [...new Set(allData.map(item => item.Customer_type))].sort();

        const cityFilter = document.getElementById('city-filter');
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.innerText = city;
            cityFilter.appendChild(option);
        });

        const customerTypeFilter = document.getElementById('customer-type-filter');
        customerTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.innerText = type;
            customerTypeFilter.appendChild(option);
        });
    }

    function applyFilters() {
        const dateStart = document.getElementById('date-range-start').value;
        const dateEnd = document.getElementById('date-range-end').value;
        const selectedCity = document.getElementById('city-filter').value;
        const selectedCustomerType = document.getElementById('customer-type-filter').value;

        filteredData = allData.filter(item => {
            let matches = true;

            // Date Filter (assuming 'Date' column is in YYYY-MM-DD format for filtering)
            // If 'Date' is not directly available, we might need to derive it from 'Time' or assume a fixed date.
            // For this example, let's assume we can filter by a hypothetical date or use a proxy.
            // Since the provided data has 'Time' but not 'Date', and the schema mentions 'Date' as a column,
            // we'll proceed assuming a 'Date' column exists or needs to be simulated for filtering.
            // If 'Date' is truly missing, this filter part would need adjustment.
            // For now, we'll skip date filtering if the column isn't present or properly formatted.

            // If date filtering is intended and a 'Date' column is present:
            // if (dateStart && new Date(item.Date) < new Date(dateStart)) matches = false;
            // if (dateEnd && new Date(item.Date) > new Date(dateEnd)) matches = false;

            if (selectedCity && item.City !== selectedCity) matches = false;
            if (selectedCustomerType && item.Customer_type !== selectedCustomerType) matches = false;

            return matches;
        });

        updateKPIs();
        renderCharts();
    }

    function initializeDashboard() {
        populateFilters();

        document.getElementById('date-range-start').addEventListener('change', applyFilters);
        document.getElementById('date-range-end').addEventListener('change', applyFilters);
        document.getElementById('city-filter').addEventListener('change', applyFilters);
        document.getElementById('customer-type-filter').addEventListener('change', applyFilters);
    }

    // --- Chart Rendering ---
    function renderCharts() {
        // Clear existing charts before rendering new ones
        Object.values(charts).forEach(chart => chart.destroy());
        charts = {};

        // Helper to create charts
        function createChart(canvasId, chartType, labels, dataPoints, labelName, yAxisTitle = '') {
            const ctx = document.getElementById(canvasId).getContext('2d');
            charts[canvasId] = new Chart(ctx, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: labelName,
                        data: dataPoints,
                        backgroundColor: getRandomColors(labels.length),
                        borderColor: getRandomColors(labels.length, 0.8),
                        fill: chartType === 'line',
                        tension: chartType === 'line' ? 0.1 : 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: false // Title is already in the card
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: yAxisTitle !== '',
                                text: yAxisTitle
                            }
                        }
                    }
                }
            });
        }

        // 1. Sales Trend Over Time (Line Chart)
        // This requires grouping data by date/time. Assuming 'Date' exists for this.
        // Since 'Date' is not in the sample, we'll use 'dayname' as a proxy for time aggregation.
        const salesByDay = {};
        filteredData.forEach(item => {
            const day = item.dayname; // Using dayname as a proxy for temporal aggregation
            if (!salesByDay[day]) {
                salesByDay[day] = 0;
            }
            salesByDay[day] += item.Total;
        });
        const sortedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const dayLabels = sortedDays.filter(day => salesByDay.hasOwnProperty(day));
        const dayData = dayLabels.map(day => salesByDay[day]);
        createChart('sales-trend-over-time', 'line', dayLabels, dayData, 'Total Sales', 'Sales ($)');


        // 2. Sales by Product Line (Bar Chart)
        const salesByProduct = {};
        filteredData.forEach(item => {
            if (!salesByProduct[item.Product_line]) {
                salesByProduct[item.Product_line] = 0;
            }
            salesByProduct[item.Product_line] += item.Total;
        });
        createChart('sales-by-product-line', 'bar', Object.keys(salesByProduct), Object.values(salesByProduct), 'Total Sales', 'Sales ($)');

        // 3. Gross Income by City (Bar Chart)
        const incomeByCity = {};
        filteredData.forEach(item => {
            if (!incomeByCity[item.City]) {
                incomeByCity[item.City] = 0;
            }
            incomeByCity[item.City] += item.gross_income;
        });
        createChart('gross-income-by-city', 'bar', Object.keys(incomeByCity), Object.values(incomeByCity), 'Gross Income', 'Income ($)');

        // 4. Average Rating by Customer Type (Pie Chart)
        const ratingByCustomerType = {};
        const countByCustomerType = {};
        filteredData.forEach(item => {
            if (!ratingByCustomerType[item.Customer_type]) {
                ratingByCustomerType[item.Customer_type] = 0;
                countByCustomerType[item.Customer_type] = 0;
            }
            ratingByCustomerType[item.Customer_type] += item.Rating;
            countByCustomerType[item.Customer_type]++;
        });
        const avgRatingByCustomerType = Object.keys(ratingByCustomerType).reduce((acc, type) => {
            acc[type] = ratingByCustomerType[type] / countByCustomerType[type];
            return acc;
        }, {});
        createChart('average-rating-by-customer-type', 'pie', Object.keys(avgRatingByCustomerType), Object.values(avgRatingByCustomerType), 'Average Rating');

        // 5. Sales by Payment Method (Bar Chart)
        const salesByPayment = {};
        filteredData.forEach(item => {
            if (!salesByPayment[item.Payment]) {
                salesByPayment[item.Payment] = 0;
            }
            salesByPayment[item.Payment] += item.Total;
        });
        createChart('sales-by-payment-method', 'bar', Object.keys(salesByPayment), Object.values(salesByPayment), 'Total Sales', 'Sales ($)');

        // 6. Average Quantity Sold by Day (Bar Chart)
        const quantityByDay = {};
        const countByDay = {};
        filteredData.forEach(item => {
            const day = item.dayname;
            if (!quantityByDay[day]) {
                quantityByDay[day] = 0;
                countByDay[day] = 0;
            }
            quantityByDay[day] += item.Quantity;
            countByDay[day]++;
        });
        const avgQuantityByDay = Object.keys(quantityByDay).reduce((acc, day) => {
            acc[day] = quantityByDay[day] / countByDay[day];
            return acc;
        }, {});
        const orderedAvgQuantityByDay = {};
        sortedDays.forEach(day => {
            if (avgQuantityByDay[day] !== undefined) {
                orderedAvgQuantityByDay[day] = avgQuantityByDay[day];
            }
        });
        createChart('average-quantity-sold-by-day', 'bar', Object.keys(orderedAvgQuantityByDay), Object.values(orderedAvgQuantityByDay), 'Average Quantity', 'Average Quantity');


        // 7. Gross Margin Percentage by Branch (Bar Chart)
        const marginByBranch = {};
        const countByBranch = {};
        filteredData.forEach(item => {
            if (!marginByBranch[item.Branch]) {
                marginByBranch[item.Branch] = 0;
                countByBranch[item.Branch] = 0;
            }
            marginByBranch[item.Branch] += item.gross_margin_percentage;
            countByBranch[item.Branch]++;
        });
        const avgMarginByBranch = Object.keys(marginByBranch).reduce((acc, branch) => {
            acc[branch] = marginByBranch[branch] / countByBranch[branch];
            return acc;
        }, {});
        createChart('gross-margin-percentage-by-branch', 'bar', Object.keys(avgMarginByBranch), Object.values(avgMarginByBranch), 'Average Gross Margin Percentage', 'Percentage (%)');
    }

    // Helper function to generate random colors for charts
    function getRandomColors(count, alpha = 0.6) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            colors.push(`rgba(${r}, ${g}, ${b}, ${alpha})`);
        }
        return colors;
    }
});
