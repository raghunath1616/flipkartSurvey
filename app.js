const questionDataController = (function() {
  const surveyResponse = {
    questionsSeen: 0,
    total: 0,
    response: {},
  }
  const getQuestions = async () => {
    try {
      const result = await fetch("https://flipkart-survey-mock.now.sh/")
      const questions = await result.json()
      return questions
    } catch (e) {
      console.log("error", e)
    }
  }

  const setSurveyResponse = data => {
    Object.assign(surveyResponse, data)
    return surveyResponse
  }

  const getSurveyResponse = () => {
    return surveyResponse
  }

  return {
    getQuestions,
    setSurveyResponse,
    getSurveyResponse,
  }
})()

const UIController = (function() {
  const DOMStrings = {
    questionStats: ".question__stats",
    questionTitle: ".question__title",
    optionsWrapper: ".options__wrapper",
    optionItem: ".option__item",
    userActionWrapper: ".user__action__wrapper",
    ctaButton: ".cta__button",
  }

  const showSingleSelect = (text, value) => {
    return `<div class="option__text">
              <input id="radio-${value}" class="option__item" type="radio" name="singleSelect" value="${value}" />
              <label for="radio-${value}">
                ${text}
              </label>
            </div>`
  }

  const showMultiSelect = text => {
    return `<div class="option__text">
              <input id="chkbox-${text}" class="option__item" type="checkbox" value="${text}" />
              <label for="chkbox-${text}">
                ${text}
              </label>
            </div>`
  }

  const renderOptions = (options, type, isMultiSelect) => {
    let html = ""
    if (type == "text" && !isMultiSelect) {
      options.map(option => {
        const {
          label: { text },
          value,
        } = option
        html += showSingleSelect(text, value)
      })
    } else {
      options.map(option => {
        const {
          label: { text },
          value,
        } = option
        html += showMultiSelect(text, value)
      })
    }
    return html
  }

  const showCTAButton = text => {
    return `<button type="button" class="cta__button">${text}</button>`
  }

  return {
    getDOMStrings: () => {
      return DOMStrings
    },
    showQuestion: (question, currentStat, totalQuestions) => {
      const {
        question: { text: title },
        optionsPerRow,
        options,
        required,
        optionType,
        multiSelect,
      } = question
      document.querySelector(DOMStrings.questionStats).innerHTML = `Question ${currentStat}/${totalQuestions}`
      document.querySelector(DOMStrings.questionTitle).innerHTML = title
      document.querySelector(DOMStrings.optionsWrapper).innerHTML = renderOptions(options, optionType, multiSelect)
      console.log("required", required)
      if (!required) {
        document.querySelector(DOMStrings.ctaButton).style.visibility = "visible"
        document.querySelector(DOMStrings.userActionWrapper).innerHTML = showCTAButton("Skip")
      }
    },
    showCTAButton,
  }
})()

const controller = (function(questionDataCtrl, UICtrl) {
  let questions = []

  let DOMStrings = UICtrl.getDOMStrings()
  const setupEventListeners = () => {
    // 1. Single select
    const options = document.querySelectorAll(DOMStrings.optionItem)
    options.forEach(option => {
      option.addEventListener("change", selectAnOption)
    })

    initializeButtonEventListener()
  }

  const initializeButtonEventListener = () => {
    // 2. CTA Button event
    document.querySelector(DOMStrings.ctaButton).addEventListener("click", event => {
      console.log("show next")
      showNext()
    })
  }

  const selectAnOption = () => {
    document.querySelector(DOMStrings.ctaButton).innerHTML = "Continue"
    document.querySelector(DOMStrings.ctaButton).style.visibility = "visible"
  }

  const showNext = () => {
    let currentQuestion = questionDataCtrl.getSurveyResponse()
    console.log(currentQuestion.questionsSeen, currentQuestion.total)
    if (currentQuestion.questionsSeen < currentQuestion.total) {
      currentQuestion = questionDataCtrl.setSurveyResponse({ questionsSeen: currentQuestion.questionsSeen + 1 })
      UICtrl.showQuestion(
        questions[currentQuestion.questionsSeen - 1],
        currentQuestion.questionsSeen,
        currentQuestion.total,
      )
    }
  }

  return {
    init: () => {
      // 1. Fetch Data from API
      const getQuestions = questionDataCtrl.getQuestions()

      // 2. Append those data to UI
      getQuestions.then(data => {
        questions = data
        console.log("questions", questions)
        questionDataCtrl.setSurveyResponse({ questionsSeen: 1, total: questions.length })
        UICtrl.showQuestion(questions[0], 1, data.length)
        setupEventListeners()
      })
    },
  }
})(questionDataController, UIController)

controller.init()
