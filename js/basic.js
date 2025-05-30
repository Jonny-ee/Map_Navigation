import { detailedInfoMap } from './room_detail.js';
import { pin_info } from './pin.js';
import { people } from './people.js';

let scale = 2;//默认缩放比例-2倍
let offsetX = 0;//X偏移量
let offsetY = 0;//Y偏移量
let isDragging = false;//拖拽状态
let startX = 0;//X鼠标起始位置
let startY = 0;//Y鼠标起始位置


const minScale = 1; // 最小缩放比例
const maxScale = 2; // 最大缩放比例
const maxMargin = 10; // 最大边距

window.addEventListener('DOMContentLoaded', () => {
  const zoomLayer = document.getElementById('zoomLayer');//缩放层
  const pinLayer = document.getElementById('pinLayer');//图钉层
  const wrapper = document.querySelector('.map-wrapper');//地图容器
  const infoPanel = document.getElementById('infoPanel');//信息面板
  const image = zoomLayer.querySelector('.map-image');//地图图片

  window.currentScale = scale;//当前缩放比例

  const tooltip = createTooltip();//创建提示框
  document.body.appendChild(tooltip);

  setupPins(pinLayer, pin_info, tooltip, infoPanel);//设置图钉
  setupSearchFunction(pin_info, infoPanel);//设置搜索功能
  setupPopup();//设置弹窗
  setupSidebar();//设置侧边栏

  applyTransform();//应用变换
  updatePinPositions();//更新图钉位置

zoomLayer.addEventListener('mousedown', (e) => {//鼠标按下事件
    isDragging = true;//拖拽状态
    startX = e.clientX;//鼠标起始位置
    startY = e.clientY;//鼠标起始位置
    zoomLayer.style.cursor = 'grabbing';//鼠标样式
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;//如果不在拖拽状态，返回
    const dx = e.clientX - startX;//鼠标移动距离
    const dy = e.clientY - startY;//鼠标移动距离
    offsetX += dx;//偏移量
    offsetY += dy;//偏移量
    startX = e.clientX;//鼠标起始位置
    startY = e.clientY;//鼠标起始位置
    applyTransform();
  });

  document.addEventListener('mouseup', () => {//鼠标释放事件
    isDragging = false;//拖拽状态
    zoomLayer.style.cursor = 'grab';//鼠标样式
  });

  zoomLayer.addEventListener('wheel', (e) => {//鼠标滚轮事件
    e.preventDefault();//阻止默认行为
    const zoomIntensity = 0.1;//缩放强度
    const direction = e.deltaY > 0 ? -1 : 1;//方向
    let newScale = scale * (1 + direction * zoomIntensity);//新缩放比例
    newScale = clamp(newScale, minScale, maxScale);//限制缩放比例

    const rect = zoomLayer.getBoundingClientRect();//获取缩放层位置
    const cx = e.clientX - rect.left;//鼠标位置
    const cy = e.clientY - rect.top;//鼠标位置

    offsetX = cx - (cx - offsetX) * (newScale / scale);//偏移量
    offsetY = cy - (cy - offsetY) * (newScale / scale);//偏移量

    scale = newScale;//缩放比例
    window.currentScale = scale;//当前缩放比例
    applyTransform();//应用变换
  }, { passive: false });

  window.addEventListener('resize', () => {//窗口调整大小事件
    updatePinPositions();//更新图钉位置
    applyTransform();//应用变换
  });
});

function applyTransform() {//应用变换
  scale = clamp(scale, minScale, maxScale);//限制缩放比例

  const image = document.querySelector('.map-image');//地图图片
  const wrapper = document.querySelector('.map-wrapper');//地图容器

  const imgWidth = image.naturalWidth * scale;//图片宽度
  const imgHeight = image.naturalHeight * scale;//图片高度

  const wrapperRect = wrapper.getBoundingClientRect();//地图容器位置
  offsetX = clamp(offsetX, wrapperRect.width - imgWidth - maxMargin, maxMargin);//偏移量
  offsetY = clamp(offsetY, wrapperRect.height - imgHeight - maxMargin, maxMargin);//偏移量

  document.getElementById('zoomLayer').style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;//应用变换

  updatePinPositions();//更新图钉位置
}

function updatePinPositions() {//更新图钉位置
  const image = document.querySelector('.map-image');//地图图片
  const imgWidth = image.naturalWidth;//图片宽度
  const imgHeight = image.naturalHeight;//图片高度

  pin_info.forEach(pin => {//遍历图钉信息
    if (!pin.element) return;//如果图钉元素不存在，返回
    
    const x = pin.x * imgWidth;//图钉x坐标
    const y = pin.y * imgHeight;//图钉y坐标
    
    pin.element.setAttribute('transform', `translate(${x}, ${y})`);//设置图钉位置
  });
}

function createTooltip() {//创建提示框
  const tooltip = document.createElement('div');//创建提示框元素
  tooltip.className = 'tooltip';//设置提示框类名
  tooltip.style.position = 'absolute';//设置提示框位置
  tooltip.style.display = 'none';//设置提示框显示状态
  tooltip.style.pointerEvents = 'none';//设置提示框鼠标事件
  return tooltip;
}

function setupPins(pinLayer, pins, tooltip, infoPanel) {//设置图钉
  pinLayer.innerHTML = '';//清空图钉层  
  const pathData = `M19.2 2.4C10.8 2.4 6 8.88 6 15.6S19.2 36 19.2 36s13.2-13.68 13.2-20.4S27.6 2.4 19.2 2.4zM13.2 15.6C13.2 12.24 15.84 9.6 19.2 9.6s6 2.64 6 6-2.64 6-6 6-6-2.64-6-6z`;//路径数据
  const image = document.querySelector('.map-image');//地图图片

  pinLayer.setAttribute('viewBox', `0 0 ${image.naturalWidth} ${image.naturalHeight}`);//设置图钉层视图框
  pinLayer.setAttribute('width', '100%');//设置图钉层宽度
  pinLayer.setAttribute('height', '100%');//设置图钉层高度

  pins.forEach(pin => {//遍历图钉信息
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');//创建路径元素
    el.setAttribute('d', pathData);//设置路径数据
    el.setAttribute('fill', '#d81e06');//设置路径颜色
    el.classList.add('map-pin');//设置路径类名
    el.dataset.id = pin.id;//设置路径id
    el.style.transition = 'all 0.3s ease';//设置路径过渡效果
    
    const x = pin.x * image.naturalWidth;//图钉x坐标
    const y = pin.y * image.naturalHeight;//图钉y坐标
    el.setAttribute('transform', `translate(${x}, ${y})`);//设置路径变换

    el.addEventListener('mouseenter', (e) => {//鼠标进入事件
      e.stopPropagation();//阻止事件冒泡
      tooltip.innerHTML = `<p>${pin.room}</p><p>${pin.type}</p>` + (pin.staff?.length ? `<p>${pin.staff.join('、')}</p>` : '');//设置提示框内容
      tooltip.style.display = 'block';//设置提示框显示状态
      highlightPin(pin.id);//高亮图钉
    });
    el.addEventListener('mousemove', (e) => {//鼠标移动事件
      tooltip.style.left = e.pageX + 10 + 'px';//设置提示框位置
      tooltip.style.top = e.pageY + 10 + 'px';//设置提示框位置
    });
    el.addEventListener('mouseleave', () => {//鼠标离开事件
      tooltip.style.display = 'none';//设置提示框显示状态
      resetPinHighlight();//重置图钉高亮
    });
    el.addEventListener('click', () => {//鼠标点击事件
      showPopup(pin);//显示弹窗
    });

    pin.element = el;//设置图钉元素
    pinLayer.appendChild(el);//添加图钉元素到图钉层

    const infoBox = createInfoBox(pin);//创建信息框
    infoPanel.appendChild(infoBox);//添加信息框到信息面板
    setupInfoBoxEvents(infoBox, pin);//设置信息框事件
  });
}

function createInfoBox(pin) {//创建信息框
  const box = document.createElement('div');//创建信息框元素
  box.className = 'info-box';//设置信息框类名
  const roomNumber = pin.id.replace('pin', '');//设置信息框内容
  box.innerHTML = `<table><tr><td style="width: 50px;">${roomNumber}</td><td>${pin.type}</td></tr></table>`;//设置信息框内容
  return box;//返回信息框元素
}

function setupInfoBoxEvents(box, pin) {//设置信息框事件
  box.addEventListener('mouseover', () => highlightPin(pin.id));//鼠标悬停事件
  box.addEventListener('mouseout', resetPinHighlight);//鼠标离开事件
  box.addEventListener('click', () => showPopup(pin));//鼠标点击事件
}

function setupSearchFunction(pins, infoPanel) {//设置搜索功能
  document.getElementById('search').addEventListener('input', function () {//搜索框输入事件
    const keyword = this.value.trim().toLowerCase();//搜索关键词
    const infoBoxes = document.querySelectorAll('.info-box');//信息框
    const pinsOnMap = document.querySelectorAll('.map-pin');//图钉

    pins.forEach((pin, index) => {//遍历图钉信息
      const matchText = [pin.room, pin.type, ...(pin.staff || [])].join(' ').toLowerCase();//匹配文本
      const match = matchText.includes(keyword);//匹配
      pinsOnMap[index].style.display = match || !keyword ? 'block' : 'none';//设置图钉显示状态
      infoBoxes[index].style.display = match || !keyword ? 'block' : 'none';//设置信息框显示状态
    });
  });
}

let highlightedPinId = null;
function highlightPin(id) {//高亮图钉
  resetPinHighlight();//重置图钉高亮
  const el = document.querySelector(`.map-pin[data-id="${id}"]`);//获取图钉元素
  if (el) {
    el.setAttribute('fill', '#EDAF25');//设置图钉颜色
    highlightedPinId = id;//设置高亮图钉id
  }
}

function resetPinHighlight() {//重置图钉高亮
  if (highlightedPinId) {//如果高亮图钉id存在
    const el = document.querySelector(`.map-pin[data-id="${highlightedPinId}"]`);//获取图钉元素
    if (el) el.setAttribute('fill', '#d81e06');//设置图钉颜色
    highlightedPinId = null;//设置高亮图钉id
  }
}

function showPopup(pin) {//显示弹窗
  const popup = document.getElementById('popup');//获取弹窗元素
  const popupBody = popup.querySelector('.popup-body');//获取弹窗内容元素
  
  // 创建弹窗内容容器
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.gap = '20px';
  
  // 创建左侧信息容器
  const infoContainer = document.createElement('div');
  infoContainer.style.flex = '1';
  let html = `<p><strong>${pin.room}</strong></p><p><strong>${pin.type}</strong></p>`;//设置弹窗内容
  if (pin.staff?.length) {
    html += '<p><strong>人员：</strong></p><ul style="padding-left: 1em;">';
    pin.staff.forEach(name => {//遍历人员信息   
      const p = people.find(p => p.name === name);//查找人员信息
      let line = p?.src ? `<a href="${p.src}" target="_blank">${name}</a>` : name;//设置人员信息
      if (p?.phone) line += `（电话：${p.phone}）`;//设置人员信息
      html += `<li>${line}</li>`;//设置人员信息
    });
    html += '</ul>';
  }
  infoContainer.innerHTML = html;
  
  // 创建右侧图片容器
  const imageContainer = document.createElement('div');
  imageContainer.style.flex = '1';
  imageContainer.style.display = 'flex';
  imageContainer.style.alignItems = 'center';
  imageContainer.style.justifyContent = 'center';
  
  // 创建图片元素
  const img = document.createElement('img');
  const roomNumber = pin.id.replace('pin', '');
  img.src = `./images/${roomNumber}.jpg`;
  img.alt = `${pin.room}实地照片`;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '300px';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '8px';
  img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
  
  // 添加图片加载错误处理
  img.onerror = function() {
    imageContainer.innerHTML = '<p style="color: #666;">暂无实地照片</p>';
  };
  
  imageContainer.appendChild(img);
  
  // 将两个容器添加到内容容器中
  contentContainer.appendChild(infoContainer);
  contentContainer.appendChild(imageContainer);
  
  // 清空并添加新的内容
  popupBody.innerHTML = '';
  popupBody.appendChild(contentContainer);
  popup.style.display = 'flex';
}

function setupPopup() {
  document.querySelector('.popup-close').addEventListener('click', () => {
    document.getElementById('popup').style.display = 'none';
  });
}

function setupSidebar() {
  const toggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggle.textContent = sidebar.classList.contains('collapsed') ? '≡' : '×';
  });
}

function clamp(value, min, max) {//限制值
  return Math.min(Math.max(value, min), max);//返回限制值
}
