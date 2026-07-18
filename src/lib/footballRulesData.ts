export interface RuleSection {
  subtitleEn: string;
  subtitleZh: string;
  contentEn: string;
  contentZh: string;
}

export interface FootballLaw {
  id: number;
  titleEn: string;
  titleZh: string;
  categoryEn: string;
  categoryZh: string;
  summaryEn: string;
  summaryZh: string;
  sections: RuleSection[];
}

export const footballRulesData: FootballLaw[] = [
  {
    id: 1,
    titleEn: "Law 1: The Field of Play",
    titleZh: "第一章：比赛场地",
    categoryEn: "Field & Equipment",
    categoryZh: "场地与装备",
    summaryEn: "Covers the field surface, boundary markings, official dimensions for domestic and international play, goal post technical specifications, Goal Line Technology (GLT), and video review areas (VOR/RRA).",
    summaryZh: "涵盖比赛场地的表面材质、边界划线、国内与国际比赛的官方尺寸、球门及门柱的技术标准、门线技术（GLT）的应用规范，以及视频助理裁判复审区域（VOR/RRA）的布置要求。",
    sections: [
      {
        subtitleEn: "1. Field surface",
        subtitleZh: "1. 场地表面材质",
        contentEn: "The field of play must be a wholly natural or, if competition rules permit, a wholly artificial playing surface except where competition rules permit an integrated combination of artificial and natural materials (hybrid system). The colour of artificial surfaces must be green. Where artificial surfaces are used in competition matches between representative teams of national football associations affiliated to FIFA or international club competition matches, the surface must meet the requirements of the FIFA Quality Programme for Football Turf, unless special dispensation is given by The IFAB.",
        contentZh: "比赛场地必须是天然草坪，或者在赛事规则允许的情况下，采用全人造草坪。除非赛事规则允许人工和天然材料的混合系统（混合草坪）。人造草坪的颜色必须为绿色。在国际足联会员协会代表队之间的比赛或国际俱乐部赛事中，人造表面必须符合国际足联足球草坪质量计划的要求，除非获得IFAB的特别豁免。"
      },
      {
        subtitleEn: "2. Field markings",
        subtitleZh: "2. 场地标记线",
        contentEn: "The field of play must be rectangular and marked with continuous lines which must not be dangerous; artificial playing surface material may be used for the field markings on natural fields if it is not dangerous. These lines belong to the areas of which they are boundaries. Only the lines indicated in Law 1 are to be marked on the field of play. Where artificial surfaces are used, other lines are permitted provided they are a different colour and clearly distinguishable from the football lines. The two longer boundary lines are touchlines. The two shorter lines are goal lines. The field of play is divided into two halves by a halfway line, which joins the midpoints of the two touchlines. The centre mark is at the midpoint of the halfway line. A circle with a radius of 9.15 m (10yds) is marked around it. Measurements are from the outside of the lines as the lines are part of the area they enclose. All lines must be of the same width, which must not be more than 12 cm (5ins). The goal lines must be of the same width as the goalposts and the crossbar. A player who makes unauthorised marks on the field of play must be cautioned for unsporting behaviour.",
        contentZh: "比赛场地必须为长方形，并用不具危险性的连续线条进行标记。在天然草坪上，如果人造材质线条不具危险性，允许使用它进行标记。线属于其作为边界的区域。场地上只允许画出第一章规定的线条。在采用人造表面的场地上，允许画出其他线条，只要它们的颜色与足球线不同，并且能清晰区分。两条较长的边界线为边线，两条较短的为球门线。场地由一条中线连接两条边线的中点，划分为两个半场。中点位于中线的中点。以中点为圆心，画一个半径为9.15米（10码）的圆。所有线宽必须相同，不得超过12厘米（5英寸）。球门线的宽度必须与门柱及横梁的宽度相同。任何在场地上画非授权标记的队员将因非体育行为被予以黄牌警告。"
      },
      {
        subtitleEn: "3. Dimensions",
        subtitleZh: "3. 常规比赛场地尺寸",
        contentEn: "The touchline must be longer than the goal line.\n- Length (touchline): minimum 90 m (100 yds), maximum 120 m (130 yds)\n- Length (goal line): minimum 45 m (50 yds), maximum 90 m (100 yds)\nCompetitions may determine the length of the goal line and touchline within the above dimensions.",
        contentZh: "边线长度必须大于球门线长度。\n- 长度（边线）：最少 90 米（100 码），最多 120 米（130 码）\n- 宽度（球门线）：最少 45 米（50 码），最多 90 米（100 码）\n各赛事组委会可在上述尺寸范围内自行确定比赛场地的具体长宽。"
      },
      {
        subtitleEn: "4. Dimensions for international matches",
        subtitleZh: "4. 国际比赛场地尺寸",
        contentEn: "- Length (touchline): minimum 100 m (110 yds), maximum 110 m (120 yds)\n- Length (goal line): minimum 64 m (70 yds), maximum 75 m (80 yds)\nCompetitions may determine the length of the goal line and touchline within the above dimensions.",
        contentZh: "- 长度（边线）：最少 100 米（110 码），最多 110 米（120 码）\n- 宽度（球门线）：最少 64 米（70 码），最多 75 米（80 码）\n各国际赛事组委会可在上述尺寸范围内规定具体的长宽。"
      },
      {
        subtitleEn: "5. The goal area",
        subtitleZh: "5. 球门区（小禁区）",
        contentEn: "Two lines are drawn at right angles to the goal line, 5.5 m (6 yds) from the inside of each goalpost. These lines extend into the field of play for 5.5 m (6yds) and are joined by a line drawn parallel with the goal line. The area bounded by these lines and the goal line is the goal area.",
        contentZh: "在距每根门柱内侧5.5米（6码）处的球门线上，向场内画两条垂直于球门线、长度为5.5米（6码）的线，并用一条与球门线平行的线相连。这些线与球门线所包围的区域即为球门区。"
      },
      {
        subtitleEn: "6. The penalty area",
        subtitleZh: "6. 罚球区（大禁区）",
        contentEn: "Two lines are drawn at right angles to the goal line, 16.5 m (18 yds) from the inside of each goalpost. These lines extend into the field of play for 16.5 m (18 yds) and are joined by a line drawn parallel with the goal line. The area bounded by these lines and the goal line is the penalty area. Within each penalty area, a penalty mark is made 11 m (12 yds) from the midpoint between the goalposts. An arc of a circle with a radius of 9.15 m (10 yds) from the centre of each penalty mark is drawn outside the penalty area.",
        contentZh: "在距每根门柱内侧16.5米（18码）处的球门线上，向场内画两条垂直于球门线、长度为16.5米（18码）的线，并用一条与球门线平行的线相连。这些线与球门线所包围的区域即为罚球区。在每个罚球区内，在两根球门柱中点垂直向场内11米（12码）处划一个罚球点（点球点）。以点球点为圆心，在罚球区外绘制一个半径为9.15米（10码）的弧线（罚球弧）。"
      },
      {
        subtitleEn: "7. The corner area",
        subtitleZh: "7. 角球区",
        contentEn: "The corner area is defined by a quarter circle with a radius of 1 m (1 yd) from each corner flagpost drawn inside the field of play.",
        contentZh: "以每个角旗杆为圆心，向比赛场地内画一个半径为1米（1码）的四分之一圆弧，其所包围的区域即为角球区。"
      },
      {
        subtitleEn: "8. Flagposts",
        subtitleZh: "8. 角旗杆与半场旗杆",
        contentEn: "A flagpost, at least 1.5 m (5 ft) high, with a non-pointed top and a flag must be placed at each corner. Flagposts may be placed at each end of the halfway line, at least 1m (1yd) outside the touchline.",
        contentZh: "每个角上必须放置一个高度不低于1.5米（5英尺）的角旗杆，旗杆顶端不能是尖的，上面应挂有旗帜。也可以在中线两端、距离边线外侧至少1米（1码）处放置旗杆。"
      },
      {
        subtitleEn: "9. The technical area",
        subtitleZh: "9. 技术区域（教练席区域）",
        contentEn: "The technical area relates to matches played in stadiums with a designated sitting area for team officials, substitutes and substituted players: it should only extend 1 m (1 yd) on either side of the designated seated area and up to a distance of 1 m (1 yd) from the touchline; markings should be used to define the area. Only one person at a time is authorised to convey tactical instructions from the technical area. Occupants must behave in a responsible manner and remain within its confines except in special circumstances.",
        contentZh: "技术区域适用于在设有球队官员、替补队员和被替换队员专属座位区域的体育场内进行的比赛。该区域应只从指定座位区域两侧向外延伸1米（1码），且向前延伸至距离边线1米（1码）处。应使用标记线来确定该区域。每次只允许一个人在技术区域传达战术指令。技术区域内人员必须举止文明，且除特殊情况（如医生在裁判允许下入场查看伤员）外，必须留在该区域内。"
      },
      {
        subtitleEn: "10. Goals",
        subtitleZh: "10. 球门",
        contentEn: "A goal must be placed on the centre of each goal line. It consists of two vertical posts equidistant from the corner flagposts and joined at the top by a horizontal crossbar. The distance between the inside of the posts is 7.32 m (8 yds) and the distance from the lower edge of the crossbar to the ground is 2.44 m (8 ft). The posts and crossbar must be white and have the same width and depth, which must not exceed 12 cm (5 ins). Goals (including portable goals) must be firmly secured to the ground.",
        contentZh: "球门必须置于每条球门线的中央。球门由两根距角旗杆等距离的垂直门柱和一根水平横梁连接而成。两根门柱内侧的距离为7.32米（8码），横梁下沿至地面的距离为2.44米（8英尺）。门柱与横梁必须为白色，具有相同的宽度和深度，且不得超过12厘米（5英寸）。球门（包括移动式球门）必须牢固地锚定在地面上。"
      },
      {
        subtitleEn: "11. Goal line technology (GLT)",
        subtitleZh: "11. 门线技术",
        contentEn: "GLT systems may be used to verify whether a goal has been scored. Indication of a goal must be immediate and automatically confirmed within one second by the GLT system only to the match officials (via referee's watch by vibration and visual signal, and/or via earpiece); it may also be sent to the video operation room (VOR). Must meet FIFA Quality standards.",
        contentZh: "门线技术（GLT）可用于验证是否进球以支持裁判的裁决。进球的判别必须是即时的，并在1秒钟内自动向裁判员（通过手表的震动和视觉信号，和/或通过耳麦耳机）进行确认和通报，也可以同步发送到视频操作室（VOR）。必须符合FIFA质量标准。"
      },
      {
        subtitleEn: "12. Commercial advertising",
        subtitleZh: "12. 商业广告规范",
        contentEn: "No form of commercial advertising, whether real or virtual, is permitted on the field of play, on the ground within the goal nets, the technical area, or the referee review area (RRA), from the time the teams enter the field until they leave it. Advertising is forbidden on goals, nets, flagposts, or their flags. Upright advertising must be at least 1 m from touchlines and goal nets.",
        contentZh: "从球队进入比赛场地到上半场结束离开，以及从球队重新进入比赛场地到比赛结束，比赛场地表面、球网内地面、技术区域或裁判回看区（RRA）地面上，均严禁出现任何实物或虚拟的商业广告。球门、球网、角旗杆和旗帜上也不允许有广告。直立式广告板必须距离边线和球网至少1米（1码）。"
      },
      {
        subtitleEn: "13. Logos and emblems",
        subtitleZh: "13. 徽章与标志",
        contentEn: "The reproduction, whether real or virtual, of representative logos or emblems of FIFA, confederations, national football associations, competitions, clubs or other bodies is forbidden on the field of play, the goal nets and the areas they enclose, the goals, and the flagposts during playing time. They are permitted on the flags on the flagposts.",
        contentZh: "在比赛进行期间，严禁在比赛场地表面、球网及其包围区域、球门、角旗杆上绘制或投射（无论是实体还是虚拟）FIFA、各联合会、国家协会、联赛、俱乐部或其他机构的标志或徽章。但允许印在角旗的旗帜上。"
      },
      {
        subtitleEn: "14. Video assistant referees (VARs)",
        subtitleZh: "14. 视频助理裁判相关区域",
        contentEn: "In matches using VARs there must be a video operation room (VOR) and at least one referee review area (RRA). Only authorised persons may enter the VOR. A player, substitute, or team official who enters the VOR will be sent off (red card). Anyone who enters the RRA will be cautioned (yellow card).",
        contentZh: "在使用VAR的比赛中，必须设有视频操作室（VOR）和至少一个裁判回看区（RRA）。仅授权人员能进入VOR，任何球员、替补、或球队官员进入VOR将被直接罚下（红牌）；而未经允许进入RRA回看区域的球员或球队官员，将被予以黄牌警告。"
      }
    ]
  },
  {
    id: 2,
    titleEn: "Law 2: The Ball",
    titleZh: "第二章：足球",
    categoryEn: "Field & Equipment",
    categoryZh: "场地与装备",
    summaryEn: "Defines the physical specifications of the match ball (weight, size, pressure), quality approvals, and the procedures for replacing a defective ball during play.",
    summaryZh: "定义了比赛用球的物理规格（重量、尺寸、气压）、官方质量认证标志，以及在比赛中球体损坏时的更换程序。",
    sections: [
      {
        subtitleEn: "1. Qualities and measurements",
        subtitleZh: "1. 足球规格与物理属性",
        contentEn: "All balls must be spherical, made of suitable material, of a circumference of between 68 cm (27 ins) and 70 cm (28 ins), between 410 g (14 oz) and 450 g (16 oz) in weight at the start of the match, and of a pressure equal to 0.6–1.1 atmosphere (600–1,100 g/cm2) at sea level. Must bear official marks of FIFA Quality Programme.",
        contentZh: "比赛用球必须是球形的，由适合的材料制成。周长必须在68厘米（27英寸）至70厘米（28英寸）之间。比赛开始时的重量必须在410克（14盎司）至450克（16盎司）之间。气压在海平面相当于0.6至1.1个大气压。必须带有国际足联质量计划的官方认证标志。"
      },
      {
        subtitleEn: "2. Replacement of a defective ball",
        subtitleZh: "2. 损坏球的更换程序",
        contentEn: "If the ball becomes defective, play is stopped and restarted with a dropped ball. If it occurs at a kick-off, goal kick, corner kick, free kick, penalty kick, or throw-in, the restart is retaken. If it becomes defective during a penalty kick as it moves forward and before touching a player/post, the penalty is retaken.",
        contentZh: "如果球在比赛中破裂或损坏，必须停止比赛，并以坠球重新开始。如果是发生在开球、球门球、角球、任意球、点球或掷界外球发出时，应重开。如果球在罚点球罚出后、向前移动且未触碰任何球员、门框前损坏，则点球重新主罚。未经裁判允许不得更换球。"
      },
      {
        subtitleEn: "3. Additional balls",
        subtitleZh: "3. 备用球",
        contentEn: "Additional balls which meet the requirements of Law 2 may be placed around the field of play and their use is under the referee’s control.",
        contentZh: "符合第二章要求的多余备用球可以放置在比赛场地周围，其使用和调度完全在主裁判的控制之下。"
      }
    ]
  },
  {
    id: 3,
    titleEn: "Law 3: The Players",
    titleZh: "第三章：队员人数",
    categoryEn: "Field & Equipment",
    categoryZh: "场地与装备",
    summaryEn: "Specifies the number of players (max 11, min 7), rules on substitutions (up to 5 in official competitions), substitution opportunities, goalie changes, and handling extra persons or unauthorized entries on the field.",
    summaryZh: "规定了每队上场人数（最多11人，最少7人）、替补替换规则（官方赛事最多5个名额及3次机会）、更换守门员的程序，以及如何处理场上多余人员或未经允许入场者的处罚规则。",
    sections: [
      {
        subtitleEn: "1. Number of players",
        subtitleZh: "1. 队员人数限制",
        contentEn: "A match is played by two teams, each with a maximum of eleven players; one must be the goalkeeper. A match may not start or continue if either team has fewer than seven players. If players deliberately leave making the team have fewer than seven, the referee is not obliged to stop, but play cannot resume after the ball goes out if seven is not met.",
        contentZh: "一场比赛由两支球队进行，每队最多11名队员，其中一人必须是守门员。如果任何一队上场队员少于7人，比赛不能开始或继续。若因队员故意离开场地导致人数少于7人，裁判员不被强制要求立即停止比赛，可以掌握有利，但球出界后，若该队未达到最少7人，比赛绝不能恢复。"
      },
      {
        subtitleEn: "2. Number of substitutions",
        subtitleZh: "2. 替补人数与加时赛名额",
        contentEn: "Official competitions allow a maximum of 5 substitutes. Each team has a maximum of 3 substitution opportunities during play, and can also make subs at half-time. In extra time, any unused subs/opportunities carry over, and rules may grant an additional sub and opportunity. In other senior matches, maximum of 6 subs can be used unless agreed.",
        contentZh: "官方比赛最多允许进行5名替补队员的替换。两队在比赛中最多各有3次替换机会，中场休息时的替换不占用替换机会。加时赛中，未使用的名额及机会可累积使用，规则还可允许额外1名替补名额和1次替换机会。其他友谊赛最多使用6名替补，除非双方另有约定且在赛前告知裁判。"
      },
      {
        subtitleEn: "3. Substitution procedure",
        subtitleZh: "3. 替换程序与10秒离场制",
        contentEn: "The referee must be informed before any substitution. The player being substituted must leave by the nearest point on the boundary line within ten seconds of the board being shown, otherwise they are cautioned if they delay the restart. The substitute only enters during a stoppage, at the halfway line, after the replaced player leaves.",
        contentZh: "任何替补替换前必须通知裁判。被换下队员必须在替补板亮起后，从最近的边界线点在10秒内离开场地，否则因无故拖延恢复时间而被予以警告。替补队员只能在比赛暂停时，从中线处，在被换下队员完全离场并得到裁判员信号后，方可进入场地。"
      },
      {
        subtitleEn: "4. Changing the goalkeeper",
        subtitleZh: "4. 更换守门员",
        contentEn: "Any of the players may change places with the goalkeeper if the referee is informed before the change is made, and the change is made during a stoppage in play.",
        contentZh: "任何场上队员都可以和守门员交换位置，前提是必须在交换前通知主裁判，且该交换必须在比赛暂停时进行。"
      },
      {
        subtitleEn: "5. Offences and sanctions",
        subtitleZh: "5. 违规与处罚",
        contentEn: "If a named substitute starts instead of a named player and the referee is not informed, the substitute continues, no card is shown, and the named player becomes a substitute. If a player changes places with the goalkeeper without permission, play continues, and both are cautioned when the ball is next out of play.",
        contentZh: "如果是提名的替补队员代替首发队员首发，而裁判未被告知，裁判允许其继续比赛，不予处罚，首发变替补。如果队员未经主裁允许与守门员私自交换位置，裁判应允许比赛继续，但在下一次球出界时对双方队员予以警告。"
      },
      {
        subtitleEn: "6. Players and substitutes sent off",
        subtitleZh: "6. 队员及替补队员红牌罚下",
        contentEn: "A player sent off before submission of team list cannot be named. After being named and before kick-off, they may be replaced by a substitute. If sent off after kick-off, they cannot be replaced. A named substitute who is sent off cannot be replaced.",
        contentZh: "在提交队员名单前被罚下的队员不能列入名单。在列入名单后、开球前被罚下的队员，可由提名替补队员替换，但该替补名额不予补回。开球后被罚下的队员不能被替换。被提名的替补队员被罚下后不能再补报。"
      },
      {
        subtitleEn: "7. Extra persons on the field of play",
        subtitleZh: "7. 场上多余人员",
        contentEn: "Team officials are anyone named on the list except players/subs. Anyone else is an outside agent. If an extra person enters, referee stops play only if they interfere. If a team official, sub, or sent-off player interferes, restart is a direct free kick or penalty. Outside agent interference restarts with a dropped ball.",
        contentZh: "除了球员和替补外，在名单上的人员都是球队官员。其他人均为外部人员。如果有额外人员进入场地，裁判仅在他们干扰比赛时停止比赛。若是球队官员、替补或已被罚下的球员干扰比赛，判直接任意球或罚球点球。若是外部人员干扰比赛，则以坠球重新开始。"
      },
      {
        subtitleEn: "8. Player outside the field of play",
        subtitleZh: "8. 队员在比赛场地外",
        contentEn: "If a player who requires permission to re-enter does so without it, referee stops play (not immediately if no interference) and cautions the player. Restart is a direct free kick from position of interference, or indirect free kick from ball position if no interference.",
        contentZh: "如果需要裁判允许才能重新进场的队员未经允许私自进场，裁判应停止比赛（无干扰时不需立即停止）并警告该队员。如果因该事件停止比赛，在其干扰比赛的位置罚直接任意球；若无干扰，则在停止比赛时球所在位置罚间接任意球。"
      },
      {
        subtitleEn: "9. Goal scored with an extra person on the field of play",
        subtitleZh: "9. 场上有额外人员时的进球有效性",
        contentEn: "If after a goal, before restart, the referee realizes an extra person was on the field and interfered: disallow the goal if the person was a player, sub, or official of the scoring team (direct free kick restart). Allow the goal if the person was from the conceding team or an outside agent not interfering.",
        contentZh: "如果进球后、恢复比赛前，裁判发现进球时场上有干扰比赛的额外人员：若该人员是进球方的球员、替补或球队官员，进球无效，并在该人员所在位置判直接任意球；若该人员是失球方的人员，或未干扰比赛的外部人员，则进球有效。"
      },
      {
        subtitleEn: "10. Team captain",
        subtitleZh: "10. 球队队长",
        contentEn: "Each team must have a captain on the field of play who wears an identifying armband. The team captain has no special status or privileges but has a degree of responsibility for the behaviour of the team.",
        contentZh: "每支球队必须有一名队长在场上并佩戴识别袖标。队长没有任何特殊地位或特权，但对球队的行为负有一定的责任。"
      }
    ]
  },
  {
    id: 4,
    titleEn: "Law 4: The Players’ Equipment",
    titleZh: "第四章：队员装备",
    categoryEn: "Field & Equipment",
    categoryZh: "场地与装备",
    summaryEn: "Details required safety standards, compulsory equipment items (shirts, shinguards, socks, boots), uniform color differentiation, other permissible head/face gear, electronic tracking (EPTS), and bans on political or religious slogans.",
    summaryZh: "详细规定了队员装备的安全标准、强制性基本装备（带袖上衣、护腿板、长袜、球鞋）、球衣颜色区分、其他允许佩戴的头部/面部护具、电子追踪系统（EPTS），以及严禁在装备上展示政治或宗教标语的原则。",
    sections: [
      {
        subtitleEn: "1. Safety",
        subtitleZh: "1. 安全规则",
        contentEn: "A player must not use equipment or wear anything that is dangerous. Accessories are permitted as long as they are not dangerous and are safely and securely covered. Dangerous items must be removed and not taped or covered. Players must be inspected before the start.",
        contentZh: "队员不得使用或佩戴任何危险的装备或物品。饰物如果安全且被牢固覆盖则允许佩戴，但危险物品必须摘除，不能用胶带纸覆盖。队员和替补在赛前及上场前必须接受检查。"
      },
      {
        subtitleEn: "2. Compulsory equipment",
        subtitleZh: "2. 强制性基本装备",
        contentEn: "The compulsory equipment comprises separate items: a shirt with sleeves, shorts, socks (tape must be the same colour as the sock part it covers), shinguards (suitable material and size to provide reasonable protection, covered by socks), and footwear. The captain must wear the armband.",
        contentZh: "强制性装备由独立构件组成：带袖上衣、短裤、长袜（外贴胶带或覆盖材料颜色必须与被覆盖位置长袜主色一致）、护腿板（材料及尺寸合适以提供合理保护，且被长袜完全覆盖）、足球鞋。队长必须佩戴授权的袖标。"
      },
      {
        subtitleEn: "3. Colours",
        subtitleZh: "3. 颜色要求",
        contentEn: "The two teams must wear colours that distinguish them from each other and the match officials. Each goalkeeper must wear colours that are distinguishable from the other players and the match officials. Undershirts must be a single colour matching the shirt sleeve; undershorts must match short's main colour.",
        contentZh: "两支球队的上场服装主颜色必须能够相互区分，并与裁判组人员的衣服颜色区分。守门员的服装颜色必须与其他队员和裁判员有明显区别。紧身内衣袖子颜色必须与上衣主袖口一致，紧身短裤颜色必须与短裤主色或裤腿底边颜色一致。"
      },
      {
        subtitleEn: "4. Other equipment",
        subtitleZh: "4. 其他保护及通信设备",
        contentEn: "Non-dangerous protective equipment like gloves, headgear, facemasks, knee and arm protectors of soft padded material is permitted. Electronic communication is strictly banned for players. Team officials can use small handheld equipment for tactical and welfare reasons.",
        contentZh: "允许使用手套、头部护具、面罩、膝盖及手臂护套等由软质轻量填充材料制成的非危险性保护装备，以及运动眼镜。球员严禁佩戴任何电子通信设备。球队官员可因战术和安全原因使用小型手持电子设备。"
      },
      {
        subtitleEn: "5. Slogans, statements, images and advertising",
        subtitleZh: "5. 标语、声明、图像与广告禁令",
        contentEn: "Equipment must not have any political, religious or personal slogans, statements or images. Players must not reveal undergarments that show slogans, statements or images, or advertising. Violations will be sanctioned by the competition organiser or FIFA.",
        contentZh: "装备上不得带有任何政治、宗教、个人标语、声明或图像。队员不得露出带有此类标语或非官方赞助商广告的内衣。违规者将受到赛事组织者或国际足联的处罚。"
      },
      {
        subtitleEn: "6. Offences and sanctions",
        subtitleZh: "6. 违规与处罚程序",
        contentEn: "For any offence, play need not be stopped. The player is instructed to leave the field to correct the equipment, leaving when play stops. Re-entry requires equipment check by a match official and the referee’s permission (can be given during play).",
        contentZh: "对于任何装备违规，不需要停止比赛。裁判应指示犯规队员离场修正装备（在比赛暂停时离场）。该队员必须经裁判员或助理裁判检查合格，在得到主裁判允许（可在比赛进行中允许）后方可重新回场。"
      }
    ]
  },
  {
    id: 5,
    titleEn: "Law 5: The Referee",
    titleZh: "第五章：裁判员",
    categoryEn: "Officials",
    categoryZh: "执法官员",
    summaryEn: "Outlines the referee's full authority, powers, and duties as timekeeper, advantage rules, handling on-field injuries, VAR procedures, equipment requirements, and official hand signals.",
    summaryZh: "阐述主裁判的最高执法权力、作为计时员的职责、有利条款的运用、场上伤员的处理规范、VAR的介入和审核流程、基本装备要求，以及裁判官方手势信号。",
    sections: [
      {
        subtitleEn: "1. The authority of the referee",
        subtitleZh: "1. 裁判员的最高权威",
        contentEn: "Each match is controlled by a referee who has full authority to enforce the Laws of the Game in connection with the match.",
        contentZh: "每场比赛由一名拥有完全权威的主裁判控制，以确保在该场比赛中执行竞赛规则。"
      },
      {
        subtitleEn: "2. Decisions of the referee",
        subtitleZh: "2. 裁决的效力与不可更改性",
        contentEn: "Decisions will be made to the best of the referee’s ability according to the Laws and the 'spirit of the game' and are final. The decisions must always be respected. The referee may not change a restart decision on realising it is incorrect if play has restarted or the referee has left the field.",
        contentZh: "裁判员根据规则和“足球精神”尽其最大能力做出裁决。裁判员关于比赛事实的裁决是最终裁决，必须得到绝对尊重。一旦比赛已经重新开始，或者裁判员在半场或全场结束吹哨后已经离开了比赛场地，则不得再更改之前的恢复比赛判定。"
      },
      {
        subtitleEn: "3. Powers and duties",
        subtitleZh: "3. 职责与权力范围",
        contentEn: "Enforces the Laws; controls the match; acts as timekeeper; keeps records; supervises restarts. Applies advantage: allows play to continue if non-offending team benefits, penalizing original offence if benefit does not ensue. Punishes more serious offence. Takes disciplinary action from pre-match inspection until leaving the field. Manages injuries and outside interference.",
        contentZh: "执行规则、控制比赛、担任计时员、记录比赛事件、监督和示意恢复比赛。掌握有利：当犯规发生时，若不犯规方获益，允许比赛继续进行；若有利在几秒内未显现，则惩罚原本的犯规。惩罚多重犯规中最严重的那次。从赛前检查到离开场地均拥有纪律处罚权。妥善管理伤病以及外部干扰。"
      },
      {
        subtitleEn: "4. Video assistant referee (VAR)",
        subtitleZh: "4. 视频助理裁判(VAR)的协助机制",
        contentEn: "The referee may be assisted by a VAR only in the event of a 'clear and obvious error' or 'serious missed incident' in relation to: goal/no goal, penalty/no penalty, direct red card, and mistaken identity. The referee makes the final decision.",
        contentZh: "VAR仅在发生涉及“清晰且明显的错误”或“严重遗漏事件”时提供协助，范围仅限：进球/无球、点球/无点球、直接红牌、以及判罚对象错误。主裁判始终保留唯一的最终裁决权。"
      },
      {
        subtitleEn: "5. Referee’s equipment",
        subtitleZh: "5. 裁判员的装备",
        contentEn: "Compulsory equipment: Whistle(s), Watch(es), Red and yellow cards, Notebook. Other equipment: Communication gear (buzzers/beep flags, headsets), fitness monitors, or body cameras if provided and compliant.",
        contentZh: "强制性基本装备：哨子、手表、黄红卡牌、记录本或记录笔。其他允许使用的装备：裁判对讲设备（振动旗、对讲耳机系统）、运动监测设备，以及在组委会合规规定下佩戴的随身摄像记录仪。"
      },
      {
        subtitleEn: "6. Referee signals",
        subtitleZh: "6. 裁判手势信号",
        contentEn: "Approved signals include: Advantage (one or both arms), Direct/Indirect Free kick, Penalty kick, Corner kick, Goal kick, VAR Check (finger to ear), and VAR Review (TV signal box).",
        contentZh: "官方批准的手势包括：有利手势（单臂或双臂向前指向）、直接/间接任意球指向、罚球点球（点球）手势、角球指向、球门球指向、VAR检查手势（食指指耳）以及VAR回看手势（双手在空中画电视机矩形）。"
      },
      {
        subtitleEn: "7. Liability of match officials",
        subtitleZh: "7. 裁判人员的责任豁免",
        contentEn: "A referee or other match official is not held liable for any kind of injury suffered by a player, official or spectator, any damage to property, or other loss due to any decision taken under the Laws of the Game.",
        contentZh: "对于球员、球队官员或观众所受的任何伤害，任何财产损失，或由于根据规则做出裁决而给任何个人、俱乐部或机构带来的损失，裁判员和助理裁判人员一律免予追究法律及民事责任。"
      }
    ]
  },
  {
    id: 6,
    titleEn: "Law 6: The Other Match Officials",
    titleZh: "第六章：其他裁判人员",
    categoryEn: "Officials",
    categoryZh: "执法官员",
    summaryEn: "Defines the roles, tasks, and signals of the assistant referees, fourth official, additional assistant referees, reserve assistants, and video match officials (VAR/AVAR).",
    summaryZh: "规定了助理裁判员（边裁）、第四官员（四官）、附加助理裁判员（底线裁判）、候补助理裁判以及视频裁判（VAR/AVAR）的具体职责和旗示信号。",
    sections: [
      {
        subtitleEn: "1. Assistant referees",
        subtitleZh: "1. 助理裁判员（边裁）",
        contentEn: "They indicate when: the whole ball leaves the field; which team gets corner, goal kick or throw-in; offside positions; substitution requests; or keeper encroachment at penalty kicks. They can enter the field to help manage the 9.15m distance.",
        contentZh: "助理裁判员协助指出：球何时整体出界、应由哪方发角球/球门球/扔界外球、判定越位、替补申请、以及主罚点球时守门员是否提前越线移动。他们可以入场协助裁判管理9.15米的防守防线距离。"
      },
      {
        subtitleEn: "2. Fourth official",
        subtitleZh: "2. 第四官员（四官）",
        contentEn: "The fourth official's assistance includes: supervising substitution procedures; checking player equipment; managing player re-entry; supervising replacement balls; indicating minimum additional time at the end of half; informing referee of technical area misconduct.",
        contentZh: "第四官员在场边协助：监督并管理替补队员更换程序；检查球员上场装备；接应场外队员重新回场；管理备用比赛球；在每半场结束时操作补时板指示最少补时；监督教练技术席并及时向主裁通报 technical area 内人员的违规不正当行为。"
      },
      {
        subtitleEn: "3. Additional assistant referees",
        subtitleZh: "3. 附加助理裁判员（底线裁判）",
        contentEn: "Additional assistant referees indicate: when the whole ball passes over the goal line (including when a goal is scored); which team gets corner or goal kick; whether, at penalty kicks, the goalkeeper moves off the line.",
        contentZh: "附加助理裁判员（通常设在两端球门立柱侧底线外）协助指示：皮球是否整体越过球门线（包括判定是否进球）；哪方应踢角球或球门球；以及在主罚点球时，守门员是否提前前跨或移动越过球门线。"
      },
      {
        subtitleEn: "4. Reserve assistant referee",
        subtitleZh: "4. 候补助理裁判员",
        contentEn: "A reserve assistant referee may replace an assistant referee, fourth official or additional assistant referee who is unable to continue, and may also assist the referee in the same way as the other 'on-field' match officials.",
        contentZh: "候补助理裁判主要职责是替换无法继续执法的助理裁判、第四官员或附加助理裁判，也可以在场外提供与其他裁判相同的记录协助。"
      },
      {
        subtitleEn: "5. Video match officials",
        subtitleZh: "5. 视频裁判人员 (VAR & AVAR)",
        contentEn: "The video assistant referee (VAR) assists the referee by using replay footage in the VOR only for direct red cards, goals, penalties, or mistaken identity. The assistant VAR (AVAR) assists by watching television footage, keeping records, and managing communications.",
        contentZh: "视频助理裁判（VAR）通过多机位慢动作回放，在涉及红牌、点球、进球和认错球员时向主裁提供修正协助。助理视频裁判（AVAR）主要在VAR回看时盯住直播流画面、记录回看事件并协助VAR与主裁顺畅通话。"
      },
      {
        subtitleEn: "6. Assistant referee signals",
        subtitleZh: "6. 边裁官方旗示手势",
        contentEn: "Official flag signals include: Substitution (flag held horizontally overhead with both hands), Throw-in direction, Goal kick (flag pointing straight forward), Corner kick (flag pointing down towards corner), Offside (flag pointed up), and Offside location (near, middle, far side).",
        contentZh: "官方旗示包括：替补手势（双臂举旗水平过顶）、掷界外球指向（横举斜指）、球门球指向（直臂平行向前指）、角球指向（斜下指向本侧角球区）、越位示意（红黄旗直立高举），以及通过旗帜不同倾角表示越位发生在赛场的近端、中段、或远端。"
      },
      {
        subtitleEn: "7. Additional assistant referee signals",
        subtitleZh: "7. 附加边裁旗示手势",
        contentEn: "A AAR signals a goal by indicating towards the center mark, or signals whether the ball crossed the line via a direct gesture.",
        contentZh: "底线裁判通过特定手势（如指向中圈）来表示进球，或通过简明手势来判定球已经完全出底线。"
      }
    ]
  },
  {
    id: 7,
    titleEn: "Law 7: The Duration of the Match",
    titleZh: "第七章：比赛时间",
    categoryEn: "Time & Score",
    categoryZh: "比赛时序",
    summaryEn: "Establishes periods of play, half-time intervals, rules for adding time lost (injury, substitutions, time-wasting, VAR checks), and procedures for abandoned matches.",
    summaryZh: "确立了标准的比赛时长、中场休息时间、伤停补时的计算因素（伤病、换人、拖延时间、VAR复审等），以及对于中断/腰折比赛的重赛规定。",
    sections: [
      {
        subtitleEn: "1. Periods of play",
        subtitleZh: "1. 比赛标准时长",
        contentEn: "A match lasts for two equal halves of 45 minutes, which may only be reduced if agreed between the referee and the two teams before the start of the match and if in accordance with competition rules.",
        contentZh: "一场标准比赛由两个相等的45分钟半场组成。只有在开球前经裁判员和双方球队同意，且符合该联赛规程的前提下，才可缩短半场比赛时长。"
      },
      {
        subtitleEn: "2. Half-time interval",
        subtitleZh: "2. 中场休息时间",
        contentEn: "Players are entitled to an interval at half-time, not exceeding 15 minutes; a short drinks break (which should not exceed one minute) is permitted at the interval of half-time in extra time. Competition rules must state the duration.",
        contentZh: "队员有权获得中场休息时间，该休息时间不得超过15分钟。在加时赛的中场休息时，允许进行不超过1分钟的简短饮水补充。具体休息时长必须在赛事规程中写明，改变休息时间需获得裁判允许。"
      },
      {
        subtitleEn: "3. Allowance for time lost",
        subtitleZh: "3. 伤停补时计算规则",
        contentEn: "Allowance is made by the referee in each half for all playing time lost through: substitutions; assessment and/or removal of injured players; wasting time; disciplinary sanctions; medical breaks (drinks/cooling breaks); delays for VAR checks/reviews; goal celebrations; or any other cause.",
        contentZh: "裁判员将在每半场末端补足因以下原因损耗的比赛时间：替补队员替换；伤员评估与运送；故意拖延时间；纪律处罚；医疗暂停（补水、降温降暑暂停）；因VAR检查和审核延时；进球庆祝，以及其他无故导致的比赛中断。"
      },
      {
        subtitleEn: "4. Penalty kick",
        subtitleZh: "4. 点球的半场延时主罚",
        contentEn: "If a penalty kick has to be taken or retaken, the half is extended until the penalty kick is completed.",
        contentZh: "如果在半场即将结束时判罚了罚球点球（点球）或需要重新主罚，该半场必须被延长，直至该点球惩罚主罚完毕。"
      },
      {
        subtitleEn: "5. Abandoned match",
        subtitleZh: "5. 中途弃赛与中断比赛",
        contentEn: "An abandoned match is replayed unless the competition rules or organisers determine otherwise.",
        contentZh: "被终止（腰折）的比赛应当重新比赛进行补赛，除非赛事规程或组委会另有规定。"
      }
    ]
  },
  {
    id: 8,
    titleEn: "Law 8: The Start and Restart of Play",
    titleZh: "第八章：比赛开始和重新开始",
    categoryEn: "Time & Score",
    categoryZh: "比赛时序",
    summaryEn: "Defines the coin-toss procedure, kick-off positioning, rules for scoring directly from kick-offs, and dropped ball procedures for both inside and outside the penalty area.",
    summaryZh: "定义了赛前的掷币程序、开球时队员的站位要求、开球直接进球的判定规则，以及在罚球区（禁区）内外进行坠球（非争议球恢复）的具体操作步骤。",
    sections: [
      {
        subtitleEn: "1. Kick-off",
        subtitleZh: "1. 开球程序",
        contentEn: "Coin toss: winner chooses goal to attack or kick-off. In second half, teams change ends. For every kick-off: all players except kicker must be in their own half. Opponents must stay at least 9.15m (10 yds) away. Kicked and clearly moves. Goals can be scored directly from kick-off.",
        contentZh: "开球赛前通过掷币决定。猜中者决定进攻方向或选择进行开球。下半场双方交换场地和进攻方向。每次开球时：除了主罚队员外，其余所有球员必须留在本方半场。防守方队员必须距离球至少9.15米（10码）。球被踢且明显移动后即为进入比赛状态。可以直接射门得分。"
      },
      {
        subtitleEn: "2. Dropped ball",
        subtitleZh: "2. 坠球规则与位置",
        contentEn: "If stopped inside penalty area, the ball is dropped for the defending goalkeeper. Outside, it is dropped for one player of the team that last touched/retained possession. All other players must stay at least 4m (4.5 yds) away. In play when touching ground.",
        contentZh: "如果在罚球区（禁区）内停止比赛，裁判将球坠给防守方守门员。在罚球区外，球将坠给最后触球或原本拥有控球权一方的一名队员。其余所有队员（不分敌我）必须距离球至少4米（4.5码）。球触地即为进入比赛状态。"
      }
    ]
  },
  {
    id: 9,
    titleEn: "Law 9: The Ball in and out of Play",
    titleZh: "第九章：比赛进行及死球",
    categoryEn: "Time & Score",
    categoryZh: "比赛时序",
    summaryEn: "Defines what constitutes ball out of play (wholly crossing boundary lines, stopped by referee, or touching officials causing attacks/turnovers) and ball in play.",
    summaryZh: "定义了何为死球/球出界（皮球整体越过边线或底线、主裁鸣哨暂停、或触及裁判引发攻势/球权转换）以及何为比赛进行中。",
    sections: [
      {
        subtitleEn: "1. Ball out of play",
        subtitleZh: "1. 比赛死球的情况",
        contentEn: "The ball is out of play when: it has wholly passed over the goal line or touchline on the ground or in the air; play has been stopped by the referee; or it touches a match official, remains on the field of play and: a promising attack starts, ball goes directly into goal, or possession changes.",
        contentZh: "皮球判定为死球或出界的情况：球的整体从地面或空中越过了球门线或边线；比赛已被裁判员鸣哨暂停；球触及裁判员并留在场内，且引发了极具威胁的进攻、球直接飞入球门、或控球权发生转换。在这些触及裁判员的死球情况下，均以坠球恢复比赛。"
      },
      {
        subtitleEn: "2. Ball in play",
        subtitleZh: "2. 比赛进行中的情况",
        contentEn: "The ball is in play at all other times, including when it touches a match official and play continues, or when it rebounds off a goalpost, crossbar or corner flagpost and remains on the field of play.",
        contentZh: "在所有其他时间球均为活球（在比赛进行中），包括球触及裁判员（未引发上述死球情况）继续进行，或球从门柱、横梁或角旗杆上弹回并仍留在场内。"
      }
    ]
  },
  {
    id: 10,
    titleEn: "Law 10: Determining the Outcome of a Match",
    titleZh: "第十章：确定比赛结果",
    categoryEn: "Time & Score",
    categoryZh: "比赛时序",
    summaryEn: "Rules on how a goal is scored, determining the winner, and comprehensive procedures for the penalty shoot-out (penalties), including player eligibility and keeper substitutions.",
    summaryZh: "规定了如何判定进球得分、确立获胜队伍的规则，并详细规定了互罚球点球（点球大战）的完整操作规程（包括球员资格、轮流次序及守门员替换等）。",
    sections: [
      {
        subtitleEn: "1. Goal scored",
        subtitleZh: "1. 进球判定规则",
        contentEn: "A goal is scored when the whole of the ball passes over the goal line, between the goalposts and under the crossbar, provided that no offence has been committed by the team scoring the goal.",
        contentZh: "当球的整体从两门柱之间、横梁下方越过球门线，且进球方在此前没有犯规行为时，即为进球得分。"
      },
      {
        subtitleEn: "2. Winning team",
        subtitleZh: "2. 获胜球队的确立",
        contentEn: "The team scoring the greater number of goals is the winner. If both teams score no goals or an equal number, the match is drawn. Tiebreakers: away goals rule, extra time, or penalties (penalty shoot-out).",
        contentZh: "进球数较多的一方获胜。若双方没有进球或进球数相同，比赛为平局。若赛事规程要求淘汰赛必须决出胜负，则可通过客场进球数、加时赛、或互罚球点球（点球大战）决出胜者。"
      },
      {
        subtitleEn: "3. Penalties (penalty shoot-out)",
        subtitleZh: "3. 互罚球点球（点球大战）程序",
        contentEn: "Kicks are taken alternately. Only eligible players on the field at match end can take kicks. Warnings/cautions issued during the match are not carried forward into the shoot-out. Number of players must be equalised if unbalanced. Goalkeepers can be substituted if injured and unable to continue.",
        contentZh: "两队交替主罚点球。只有比赛结束时留在场上的队员方可主罚。常规赛中的口头警告和黄牌不带入点球大战。如果一队人多，必须排除多余人数使两队主罚候选人数一致。守门员在主罚期间如果受伤无法坚持可以由名单中未使用的替补替换。"
      }
    ]
  },
  {
    id: 11,
    titleEn: "Law 11: Offside",
    titleZh: "第十一章：越位",
    categoryEn: "Offside & Misconduct",
    categoryZh: "越位犯规",
    summaryEn: "Defines offside position, hands/arms exclusion, active play involvement, deliberate play vs saves, and consequences for leaving the field to circumvent offside.",
    summaryZh: "定义了越位位置（躯干、头部、脚部超越防守线）、手部/手臂的排除规则、如何判定“干扰比赛/对手”等活跃参与行为、对手故意触球与救球的区别，以及队员离场以图规避越位处罚的纪律惩罚机制。",
    sections: [
      {
        subtitleEn: "1. Offside position",
        subtitleZh: "1. 越位位置判定",
        contentEn: "A player is in an offside position if any part of head, body or feet is in the opponents' half (excluding halfway line) and nearer to the goal line than both the ball and the second-last opponent. Hands/arms of all players (including goalkeepers) are not considered. Upper boundary of arm is bottom of armpit.",
        contentZh: "当队员的头部、躯干或脚的任何部分处于对方半场（不含中圈线），且比球和倒数第二名防守队员更接近对方球门线时，即处于越位位置。所有队员（含守门员）的手和手臂不包含在判定范围内（手臂判定分界线为腋窝底部）。处于越位位置本身并不犯规。"
      },
      {
        subtitleEn: "2. Offside offence",
        subtitleZh: "2. 越位犯规判定（参与活跃比赛）",
        contentEn: "A player in offside is only penalised on becoming involved in active play by: interfering with play (touching teammate's pass); interfering with an opponent (blocking vision, challenging, or making clear action impacting opponent); or gaining an advantage by playing a rebounded ball off posts or deliberate saves.",
        contentZh: "处于越位位置的队员只有在同伴传球或触球瞬间，参与了活跃比赛时才被判定越位犯规：干扰比赛（触及同伴传来的球）；干扰对手（阻挡视线、争抢、或做出明显干扰对手动作）；或在皮球从门框或对手救球（Save）弹回时触球以获得利益。"
      },
      {
        subtitleEn: "3. No offence",
        subtitleZh: "3. 不构成越位犯规的情况",
        contentEn: "There is no offside offence if a player receives the ball directly from a goal kick, a throw-in, or a corner kick.",
        contentZh: "如果队员直接从以下重新开始比赛的情况中收到皮球，不构成越位犯规：球门球、掷界外球、角球。"
      },
      {
        subtitleEn: "4. Offences and sanctions",
        subtitleZh: "4. 违规处罚与越位特例",
        contentEn: "If an offside offence occurs, referee awards an indirect free kick where the offence occurred (including own half). Defending players leaving the field without permission are considered on the line for offside until next stoppage or clearing halfway.",
        contentZh: "如果判定越位犯规，裁判在犯规发生的位置罚间接任意球（即使在该队员本方半场）。防守队员未经主裁允许擅自离场将被视为留在本方球门线或边线上参与越位判定，直至下一次比赛暂停或该队将球解围出罚球区向中线发展。"
      }
    ]
  },
  {
    id: 12,
    titleEn: "Law 12: Fouls and Misconduct",
    titleZh: "第十二章：犯规与不正当行为",
    categoryEn: "Offside & Misconduct",
    categoryZh: "越位犯规",
    summaryEn: "Specifies direct and indirect free kick offenses, the handball rule, keeper 8-second rule, yellow/red card offenses, DOGSO criteria, and the new team official warning rules.",
    summaryZh: "详尽规定了直接任意球与间接任意球的犯规种类、手球动作的判定分界线、守门员8秒控球限制、黄红牌警告和罚下的具体不正当行为、破坏明显得分机会（DOGSO）的降级处罚，以及针对教练等球队官员的黄红牌管辖规则。",
    sections: [
      {
        subtitleEn: "1. Direct free kick",
        subtitleZh: "1. 直接任意球犯规与手球判定",
        contentEn: "Direct free kick awarded for: charging, jumping, kicking/attempting to kick, pushing, striking/attempting to strike, tackling, or tripping in a careless, reckless, or excessive force manner. Handball: Deliberate hand/arm touch, or making the body unnaturally bigger. Scoring immediately from hand/arm is an offence.",
        contentZh: "如果队员以草率、鲁莽或使用过分力量的方式实施冲撞、跳向、踢、推、打、抢截或绊摔对手，将被判直接任意球。手球犯规：故意用手或手臂触球，或手/手臂处于使身体不自然扩大的位置并被球击中。即使是无意，手球后直接或立即进球均算犯规。"
      },
      {
        subtitleEn: "2. Indirect free kick",
        subtitleZh: "2. 间接任意球犯规",
        contentEn: "Indirect free kick awarded for: dangerous play, impeding without contact, verbal offences/dissent, preventing goalkeeper releasing ball, deliberate trick backpass to circumvent the Law.",
        contentZh: "被判罚间接任意球的犯规包括：以危险方式比赛（危险动作）、无身体接触的阻挡、言语异议、阻碍守门员发球、或通过故意挑球头球回传等欺骗行为规避回传球规则。"
      },
      {
        subtitleEn: "3. Corner kick (Keeper 8-second violation)",
        subtitleZh: "3. 角球惩罚 (守门员用手控球超时八秒新规)",
        contentEn: "A CORNER KICK is awarded if a goalkeeper, inside their penalty area, controls the ball with their hand(s)/arm(s) for more than eight seconds before releasing it. The referee will decide control, and visually count down the last five seconds with a raised hand. (2026/2027 New Law - replaces indirect free kick).",
        contentZh: "如果守门员在禁区内用手控制球超过 8 秒未将球发出，对方将获得一个【角球】！主裁判判定控球后，将举起一只手在空中视觉倒数最后 5 秒。（2026/2027 赛季全新修订版规则，颠覆了以往的禁区内间接任意球重罚，改判惩罚力度极高的角球，强力压制拖延时间行为）。"
      },
      {
        subtitleEn: "4. Disciplinary action",
        subtitleZh: "4. 纪律处罚规范 (DOGSO / 技术区域处罚)",
        contentEn: "Yellow card communicates caution; Red card communicates sending-off. DOGSO (Denying Obvious Goal-Scoring Opportunity): Inside penalty area, if committing DOGSO while attempting to play the ball and a penalty is awarded, the red card is downgraded to yellow. Referees can card coaches and technical staff in the technical area.",
        contentZh: "黄牌代表警告，红牌代表罚下。破坏明显得分机会（DOGSO）：如果在禁区内因试图争抢皮球的防守动作造成DOGSO并被判点球，红牌将被降级为黄牌。主裁判有权对技术区域内的教练等官员出示红黄牌进行警告或驱逐。"
      },
      {
        subtitleEn: "5. Restart of play after fouls and misconduct",
        subtitleZh: "5. 犯规与不正当行为后的重新开始",
        contentEn: "If the ball is out of play, restart according to previous decision. If in play and physical offence inside field: direct free kick or penalty against opponents. Verbal offences: indirect free kick. Offenses outside the field: free kick/penalty on the nearest boundary line.",
        contentZh: "如果球在死球时发生犯规，按原决定恢复。若球在活球时发生身体犯规：在场内对对手犯规判直接任意球或点球；言语犯规一律判间接任意球。若在场外发生对场内人员犯规，在距离犯规地点最近的边界线上踢任意球（若是防守方在禁区内犯正则判点球）。"
      }
    ]
  },
  {
    id: 13,
    titleEn: "Law 13: Free Kicks",
    titleZh: "第十三章：任意球",
    categoryEn: "Restarts & Set Pieces",
    categoryZh: "犯规与重新开始",
    summaryEn: "Defines types of free kicks (direct and indirect), indirect signals, wall placement requirements (1m clearance for attacking players), and quick free kick rules.",
    summaryZh: "定义了任意球的类型（直接与间接）、间接任意球的单臂上举手势、防守人墙的站位要求（当人墙大于等于3人时进攻队员需保持1米距离），以及快发任意球的掌握机制。",
    sections: [
      {
        subtitleEn: "1. Types of free kick",
        subtitleZh: "1. 任意球类别",
        contentEn: "Direct free kick: can score directly into opponents' goal. Indirect free kick: must touch another player before entering goal. Referee signals indirect by raising arm above head. If a free kick is kicked directly into own team's goal, corner kick is awarded.",
        contentZh: "直接任意球：球可以直接射入对方球门得分。间接任意球：球在进入球门前必须触及另一名队员方能判定得分。裁判员单臂举过头顶示意。如果直接任意球或间接任意球直接开进了本方球门，将判给对方一个角球。"
      },
      {
        subtitleEn: "2. Procedure",
        subtitleZh: "2. 主罚程序与人墙距离",
        contentEn: "Ball must be stationary. Opponents must remain at least 9.15m (10 yds) from the ball. For free kicks inside defending penalty area, opponents must be outside. Where three or more defenders form a 'wall', all attacking players must remain at least 1m (1 yd) from the wall.",
        contentZh: "球必须保持静止状态。防守队员必须距离球至少9.15米（10码）。在防守方禁区内主罚时，对手必须退到禁区外。当防守方3人或以上组成人墙时，所有的进攻方队员必须距离人墙至少1米（1码）。"
      },
      {
        subtitleEn: "3. Offences and sanctions",
        subtitleZh: "3. 违规与处罚",
        contentEn: "If opponent is closer than required distance, the kick is retaken unless advantage applies. If an attacking player is less than 1m from a wall of 3+ defenders, an indirect free kick is awarded. If kicker touches ball again before touching another player, indirect free kick awarded.",
        contentZh: "如果防守队员未退足距离，除非掌握有利，否则重新主罚。如果进攻方在3人或以上人墙1米内站位违规，将判给防守方间接任意球。如果主罚队员在球踢出后未触及他人前再次触球，判间接任意球。"
      }
    ]
  },
  {
    id: 14,
    titleEn: "Law 14: The Penalty Kick",
    titleZh: "第十四章：罚球点球（点球）",
    categoryEn: "Restarts & Set Pieces",
    categoryZh: "犯规与重新开始",
    summaryEn: "Detailed layout of the penalty kick procedure, requirements for the goalkeeper's positioning on the goal line, restrictions on distraction, and a comprehensive infractions table.",
    summaryZh: "详细解构罚球点球（点球）的主罚步骤、守门员踩在球门线上的姿态规范、对守门员干扰行为的惩罚条款，并附有一张各方违规违纪时的复合裁判裁决一览表。",
    sections: [
      {
        subtitleEn: "1. Procedure",
        subtitleZh: "1. 罚球点球主罚步骤",
        contentEn: "Ball must be stationary on the penalty mark. Kicker clearly identified. Goalkeeper must remain on the goal line, facing the kicker, without distracting them. Kicked forward. When kicked, goalkeeper must have at least part of one foot touching, in line with, or behind the goal line.",
        contentZh: "球必须静止放在罚球点上。主罚队员必须明确指定。守门员必须留在门柱间的球门线上，面对主罚队员，不得采用任何手段不公平地干扰罚球手。球必须向前踢出。球被踢的一瞬间，守门员必须至少有一只脚的部分踩在球门线上，或与球门线平齐，或在球门线后方。"
      },
      {
        subtitleEn: "2. Offences and sanctions",
        subtitleZh: "2. 犯规与重新主罚规定",
        contentEn: "If kicker offends (e.g. illegal feinting after run-up): stop play, indirect free kick for opponents, and caution kicker. If goalkeeper offends and kick is saved: retake (and warning for goalie). If dual infraction occurs: retaken unless kicker commits illegal feint (which results in indirect free kick).",
        contentZh: "如果罚球手违规（如在助跑完成后做出非法停顿假动作）：无论球罚进与否，均判间接任意球并对罚球手出示黄牌。若守门员提前越线扑出点球：重新主罚，守门员被口头警告。若双方队员均提前越线：重新主罚，除非罚球手有非法停顿假动作（此时直接惩罚罚球手，判对方间接任意球）。"
      },
      {
        subtitleEn: "3. Summary table",
        subtitleZh: "3. 裁判裁决一览表 (Summary Table)",
        contentEn: "Kicks backwards -> Indirect free kick.\nWrong kicker -> Indirect free kick & caution for wrong kicker.\nIllegal feinting -> Indirect free kick & caution for kicker.\nGoalie encroachment + Saved -> Retake & warning for goalkeeper.",
        contentZh: "点球向后踢 -> 判对方间接任意球。\n替队友罚点球（罚球队员错误） -> 判间接任意球且对踢球者出示黄牌。\n助跑完后假停顿射门（非法假动作） -> 判间接任意球且对罚球手出示黄牌。\n守门员越位移动且球被扑出 -> 点球重发，且守门员被口头警告。"
      }
    ]
  },
  {
    id: 15,
    titleEn: "Law 15: The Throw-in",
    titleZh: "第十五章：界外球",
    categoryEn: "Restarts & Set Pieces",
    categoryZh: "犯规与重新开始",
    summaryEn: "Specifies technical requirements for the thrower, opponent distance, and the new five-second countdown protocol for delaying the throw-in.",
    summaryZh: "规定了主罚手掷球的双脚姿势、对手干扰的最小避让距离（2米），以及引入的全新5秒掷界外球限时倒计时程序。",
    sections: [
      {
        subtitleEn: "1. Procedure",
        subtitleZh: "1. 掷界外球动作规范",
        contentEn: "The thrower must stand facing the field, have part of each foot on or outside the touchline, and throw with both hands from behind and over the head. Opponents must stand at least 2 m (2 yds) away. Ball is in play when it enters the field of play.",
        contentZh: "掷界外球时，主罚队员必须面向场地，双脚的部分均踩在边线上或在边线外侧地面上。必须使用双手，将球从头后经头上掷出。所有防守方队员必须退后至少2米（2码）。球进入场地内即为进入比赛状态。"
      },
      {
        subtitleEn: "2. Offences and sanctions",
        subtitleZh: "2. 违规与全新 5 秒倒计时处罚",
        contentEn: "If a player is unfairly delaying, referee whistles and signals a 5-second countdown with a raised hand. If throw-in is not taken by 5 seconds, throw-in is awarded to opponents (2026/2027 New Law - replaces former warning-only delays). If thrower touches ball again before another player, indirect free kick is awarded.",
        contentZh: "如果主罚队员拖延掷界外球，主裁判将吹哨示意并举手开启 5 秒倒计时。如果 5 秒结束仍未将球掷出，界外球控球权直接转判给对方！（2026/2027 赛季最新规则，严厉打击拖延时间行为）。如果主罚者在球发出后未触及他人前再次触球，判间接任意球。"
      }
    ]
  },
  {
    id: 16,
    titleEn: "Law 16: The Goal Kick",
    titleZh: "第十六章：球门球",
    categoryEn: "Restarts & Set Pieces",
    categoryZh: "犯规与重新开始",
    summaryEn: "Procedures for taking a goal kick, and the five-second countdown protocol which replaces goal kicks with corner kicks upon timeout.",
    summaryZh: "球门球的发球流程，以及新增的5秒开球门球倒计时惩罚机制（超时将直接将球门球升级为对方的角球）。",
    sections: [
      {
        subtitleEn: "1. Procedure",
        subtitleZh: "1. 踢球门球基本步骤",
        contentEn: "The ball must be stationary and kicked from any point within the goal area by a player of the defending team. The ball is in play when it is kicked and clearly moves. Opponents must stay outside the penalty area until in play.",
        contentZh: "球门球需在小禁区内任意一点由防守方队员静止踢出。当球被踢且明显移动时即为进入比赛，球不需要非得飞出大禁区。防守队员在球发出前必须留在禁区外。"
      },
      {
        subtitleEn: "2. Offences and sanctions",
        subtitleZh: "2. 违规与全新 5 秒超时改判角球规则",
        contentEn: "If a player is unfairly delaying the goal kick, the referee signals a 5-second countdown with a raised hand. If the kick is not taken, a CORNER KICK is awarded to the opposing team. (2026/2027 New Law). If kicker touches the ball again before another player, indirect free kick awarded.",
        contentZh: "如果开球门球方故意拖延时间，主裁判鸣哨并举手进行 5 秒视觉倒计时。若 5 秒内球未发出，对方将直接获得一个【角球】！（2026/2027 赛季全新颠覆性新规，用高威胁难度的防守角球直接惩罚开门球拖延时间行为）。若主罚队员发球后未触碰他人再次碰球，判间接任意球。"
      }
    ]
  },
  {
    id: 17,
    titleEn: "Law 17: The Corner Kick",
    titleZh: "第十七章：角球",
    categoryEn: "Restarts & Set Pieces",
    categoryZh: "犯规与重新开始",
    summaryEn: "Details technical regulations for the corner kick (placement inside corner arc, flagpost preservation), opponent spacing (9.15m), and ball-in-play conditions.",
    summaryZh: "明确角球主罚的技术标准（皮球必须置于角球弧内、角旗杆不得被拔除或移动）、对手避让距离（至少9.15米）及球进入比赛状态的判定条件。",
    sections: [
      {
        subtitleEn: "1. Procedure",
        subtitleZh: "1. 角球主罚基本步骤",
        contentEn: "The ball must be placed in the corner area nearest to where the ball passed over the goal line. Ball stationary and kicked by attacking team. Kicked and clearly moves; does not need to leave the corner area. Flagpost must not be moved. Opponents must remain at least 9.15 m (10 yds) from the corner arc.",
        contentZh: "球必须放在距离出界点最近的角球弧内。球必须处于静止状态，由进攻方队员踢出。球被踢且明显移动即为进入比赛状态（不需要非得飞出角球区）。角旗杆绝对不能被移动或拔除。防守队员必须距离角球弧至少9.15米（10码）。"
      },
      {
        subtitleEn: "2. Offences and sanctions",
        subtitleZh: "2. 角球违规处罚",
        contentEn: "If after the ball is in play, the kicker touches the ball again before it has touched another player, an indirect free kick is awarded. If the kicker commits a handball offence, a direct free kick is awarded.",
        contentZh: "如果罚角球队员在球踢出后，在球被其他球员触碰之前再次碰球，将判给对方间接任意球；若是手球犯规，则判直接任意球。"
      }
    ]
  }
];
