import React, { Component } from 'react';
import axios from 'axios';
import './main.css';

// my very first tiny React app
class App extends Component {
	render() {
		return (
			<Search/>
		)
	}
}

class Search extends Component {
	constructor() {
		super();
		// setting up the initial states that we are going to use
		this.state = {
			userName: '',
			repos: [],
			repoLimit: false,
			reposLoaded: true,
			page: 1,
			searched: false,
			error: '',
			notification: '',
			showToTop: false
		}
	}

	render() {
		return (
			<div className="search-box">
				<div className="search-form">
					<input value={this.state.userName} onChange={this.clearStates} onKeyPress={this.handleSubmission} placeholder="Search for a user"/>
					<button onClick={() => {this.handleSearch('submit')}}><i className="material-icons">search</i></button>
					<p className="error-message">{this.state.error}</p>
				</div>
				{/* ternary operator that determines, which content to show, depending on the state */}
				{!this.state.searched &&
					<p className="greeting">Enter a GitHub username and see the user's repositories</p>
				}
				{this.state.searched &&
					<div className="github-profile">
						<h2 className="github-profile-heading">Fetching <span>{this.state.userName}</span>'s repositories</h2>
						<img className="github-profile-image" src={this.state.repos[0].owner.avatar_url} alt="github-profile"/>
					</div>
				}
				<div className="search-results">
					{/* each repo gets rendered here. this is not ideal, it should be in its own component */}
					{this.state.repos.map((repo, i) => {
						return (
							<div id={`repository-${i+1}`} className="repo-item" key={repo.id}>
								<p className="repo-name"><a href={repo.html_url} target="_blank">{repo.name}</a></p>
								<div className="repo-details">
									<div className="repo-forks">
										<i className="material-icons">call_split</i><p>Forks <span>{repo.forks_count}</span></p>
									</div>
									<div className="repo-stars">
										<i className="material-icons">star</i><p>Stars <span>{repo.stargazers_count}</span></p>
									</div>
								</div>
								{repo.language &&
									<p className="repo-language"><i className="material-icons">code</i>{repo.language}</p>
								}
							</div>
						)
					})}
				</div>
				<div className="notification-message"><p>{this.state.notification}</p></div>
				{/* ternary operator that determines, when to show the loading */}
				{!this.state.reposLoaded &&
					<div className="loading">
						<div className="spinner">
							<div className="bounce1"></div>
							<div className="bounce2"></div>
							<div className="bounce3"></div>
						</div>
					</div>
				}
				{/* ternary operator that determines, when to show the "scroll to top" button */}
				{this.state.showToTop &&
					<div className="to-top" onClick={this.toTop}>
						<i className="material-icons">keyboard_arrow_up</i>
					</div>
				}
			</div>
		)
	}

	componentDidMount() {
		window.addEventListener('scroll', this.onScroll(500), false);
	}
	componentWillUnmount() {
		window.removeEventListener('scroll', this.onScroll(500), false);
	}
	onScroll = (delay) => {
		let time = Date.now();
		return () => {
			// the search function is called if the user has reached the temporary bottom of the page
			if ((time + delay - Date.now()) < 0) {
				if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 1500) && this.state.repos.length > 19){
					this.handleSearch('scroll');
				}
				time = Date.now();
			}
			// showing or hiding the "scroll to top" button, depending on how far the user has scrolled
			if (window.scrollY <= 4500){
				this.setState({
					showToTop: false
				})
			}
			else if (window.scrollY > 4500){
				this.setState({
					showToTop: true
				})
			}
		}
	}

	// function that receives a parameter, which states the origin of the function call
	handleSearch = (callOrigin) => {
		let pageNr;
		// if the function call came from submitting the search form - the page that gets passed as a paramenter into the rendering function is always 1
		if (callOrigin === 'submit'){
			this.setState({
				page: 1
			}, () => {
				pageNr = this.state.page;
				this.renderRepos(pageNr);
			})
		}
		// if we are scrolling, then the page stays the same as it was and continues to increment, thus causing the function to fetch more repos
		if (callOrigin === 'scroll'){
			pageNr = this.state.page;
			this.renderRepos(pageNr);
		}
	}
	// function for fetching data and distributing it into various states
	// please note that the same function is used for fetching results both on submit and on scroll, therefore we have to think about many different use cases
	renderRepos = (pageNr) => {
		if (this.state.userName === ''){
			this.setState({
				error: 'Please enter a username.'
			})
		}
		else if (this.state.repoLimit === false){
			// using axios to send requests to the GitHub API
			// ideally the "per_page" parameter would be 100 (max amount of results per request), but I didn't have time to split everything into two components and remake the rendering, which would include rewriting some of the code below
			axios.get(`https://api.github.com/users/${this.state.userName}/repos?per_page=20&page=${pageNr}`)
			.then(res => {
				this.setState({
					error: ''
				})
				// if no data is returned and the state array with repos is empty, then the user has no repositories at all
				if (res.data.length === 0 && this.state.repos.length === 0){
					this.setState({
						repoLimit: true,
						searched: true,
						notification: "This user doesn't have any repositories."
					})
				}
				// if there are less results than 20, then the user doesn't have any more repositories
				else if (res.data.length < 20){
					this.setState({
						repos: [...this.state.repos, ...res.data],
						reposLoaded: false,
						repoLimit: true,
						searched: true,
						notification: "This user doesn't have any more repositories."
					})
				}
				// if we have already searched once and the page passed into the function is 1, it means that we are searching for the same person's repositories again and we don't want to keep fetching more repos, since we are at the top of the page and if we want to see more - we should just continue scrolling
				else if (this.state.searched === true && pageNr === 1){
					pageNr++;
					this.setState({
						repos: res.data,
						reposLoaded: false,
						page: pageNr,
						notification: ''
					})
				}
				// if all of the above statements are false, then we just fetch user's repos, because all error cases have been successfully evaded
				else {
					pageNr++;
					this.setState({
						repos: [...this.state.repos, ...res.data],
						reposLoaded: false,
						page: pageNr,
						searched: true,
						notification: ''
					})	
				}
				// show a loading every time we fetch data
				this.initializeLoading();
			})
			.catch(error => {
				// GitHub API says that there should be an error message returned from the API, but all that gets returned is usually either 404 or 403, if the limit of requests for the APi has been exceeded, so we just display both of the cases in the error message
				this.setState({
					error: "Can't find this username on GitHub or the limit of API requests has been exceeded."
				})
				// console logging the error response to understand, which error we've received
				console.log(error);
			});
		}
	}
	// function for reseting all states (called onChange of input field)
	clearStates = (e) => {
		this.setState({
			userName: e.target.value,
			repos: [],
			repoLimit: false,
			reposLoaded: true,
			page: 1,
			searched: false,
			error: '',
			notification: '',
			showToTop: false
		})
	}
	// function for submitting the "form" by pressing Enter (we don't have a form, because I didn't want to use event.preventDefault();)
	handleSubmission = (e) => {
		if (e.key === 'Enter'){
			this.handleSearch('submit');
		}
	}
	// function for temporarily enabling the visual representation of loading, even though we don't actually need it
	initializeLoading = () => {
		setTimeout(() => {
			this.setState({
				reposLoaded: true
			})
		}, 1500);
	}
	// function for scrolling up, so it would be easier to get back to the top, if the user has scrolled too far
	toTop = () => {
		const offset = document.documentElement.scrollTop || document.body.scrollTop;
		if (offset > 0) {
			window.requestAnimationFrame(this.toTop);
			window.scrollTo(0, offset - offset / 8);
		}
	}
}

export default App;